const crypto = require('crypto');
const { prisma } = require('../lib/prisma');
const { writeAuditLog } = require('../lib/audit');
const { createNotificationRecord } = require('../lib/notifications');
const { resolveActiveMembership } = require('../services/membership.service');
const { consumeReservation, returnBorrowedStock } = require('../services/inventory-integration.service');
const { AccountError, debitBorrowFee, getCustomerAccountSnapshot } = require('../services/account.service');
const { applyReturnFines, runOverdueSweep } = require('../services/fine.service');

const ACTIVE_RESERVATION_STATUSES = ['PENDING', 'CONFIRMED', 'READY_FOR_PICKUP'];
const ACTIVE_LOAN_STATUSES = ['BORROWED', 'OVERDUE', 'RESERVED'];

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || ''));
}

function parseId(value) {
  const id = String(value || '').trim();
  return id || null;
}

function parseIdempotencyKey(req) {
  const header = req.headers['idempotency-key'] || req.headers['x-idempotency-key'];
  const value = String(header || '').trim();
  return value || null;
}

function parsePagination(query) {
  const page = Math.max(1, Number.parseInt(String(query.page || '1'), 10) || 1);
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(String(query.pageSize || '20'), 10) || 20));
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

function createLoanNumber() {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  const epoch = Date.now().toString().slice(-6);
  return `LOAN-${epoch}-${suffix}`;
}

function getBorrowFeePerItem() {
  const configured = Number(process.env.BORROW_FEE_PER_ITEM || 0);
  if (!Number.isFinite(configured) || configured < 0) {
    return 0;
  }
  return Number(configured.toFixed(2));
}

async function listLoans(req, res) {
  const { status, customer_id } = req.query;
  const pagination = parsePagination(req.query);

  const where = {
    ...(typeof status === 'string' && status ? { status } : {}),
    ...(typeof customer_id === 'string' && customer_id ? { customer_id } : {}),
  };

  try {
    const [items, total] = await Promise.all([
      prisma.loan_transactions.findMany({
        where,
        orderBy: [{ borrow_date: 'desc' }],
        skip: pagination.skip,
        take: pagination.take,
        include: {
          customers: {
            select: {
              id: true,
              customer_code: true,
              full_name: true,
              status: true,
            },
          },
          loan_items: true,
        },
      }),
      prisma.loan_transactions.count({ where }),
    ]);

    return res.json({
      data: items,
      meta: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total,
        totalPages: Math.ceil(total / pagination.pageSize) || 1,
      },
    });
  } catch (error) {
    console.error('Error while listing loans:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function getLoanById(req, res) {
  const id = parseId(req.params.id);
  if (!id || !isUuid(id)) {
    return res.status(400).json({ message: 'Invalid loan id' });
  }

  try {
    const loan = await prisma.loan_transactions.findUnique({
      where: { id },
      include: {
        customers: {
          select: {
            id: true,
            customer_code: true,
            full_name: true,
            email: true,
            phone: true,
            status: true,
          },
        },
        loan_items: true,
      },
    });

    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    return res.json({ data: loan });
  } catch (error) {
    console.error('Error while loading loan:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function convertReservationToLoan(req, res) {
  const reservationId = parseId(req.params.id);
  const actorUserId = req.user?.id || null;
  const authHeader = req.headers.authorization;
  const idempotencyKey = parseIdempotencyKey(req);

  if (!reservationId || !isUuid(reservationId)) {
    return res.status(400).json({ message: 'Invalid reservation id' });
  }

  if (!idempotencyKey) {
    return res.status(400).json({ message: 'Idempotency-Key header is required for conversion' });
  }

  try {
    const reservation = await prisma.loan_reservations.findUnique({ where: { id: reservationId } });
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    if (reservation.status === 'CONVERTED_TO_LOAN') {
      const existingLoan = await prisma.loan_transactions.findFirst({ where: { source_reservation_id: reservationId } });
      if (!existingLoan) {
        return res.status(409).json({ message: 'Reservation is already converted, but loan record was not found' });
      }
      return res.json({ data: existingLoan, idempotent: true });
    }

    if (!ACTIVE_RESERVATION_STATUSES.includes(reservation.status)) {
      return res.status(409).json({ message: `Reservation is not convertible from status ${reservation.status}` });
    }

    if (new Date(reservation.expires_at).getTime() <= Date.now()) {
      return res.status(409).json({ message: 'Reservation already expired and cannot be converted' });
    }

    const customer = await prisma.customers.findUnique({ where: { id: reservation.customer_id } });
    if (!customer || customer.status !== 'ACTIVE') {
      return res.status(409).json({ message: 'Customer is not eligible for loan conversion' });
    }

    if (Number(customer.total_fine_balance) > 0) {
      return res.status(409).json({
        message: 'Customer has unpaid fine balance',
        detail: { total_fine_balance: Number(customer.total_fine_balance) },
      });
    }

    const membershipInfo = await resolveActiveMembership(prisma, reservation.customer_id);
    if (!membershipInfo) {
      return res.status(409).json({ message: 'Customer does not have active membership' });
    }

    const activeLoanCount = await prisma.loan_transactions.count({
      where: {
        customer_id: reservation.customer_id,
        status: { in: ACTIVE_LOAN_STATUSES },
      },
    });

    if (activeLoanCount + reservation.quantity > membershipInfo.limits.max_active_loans) {
      return res.status(409).json({
        message: 'Customer exceeded max active loans limit by membership plan',
        detail: {
          max_active_loans: membershipInfo.limits.max_active_loans,
          active_loan_count: activeLoanCount,
        },
      });
    }

    const loanId = crypto.randomUUID();
    const loanNumber = createLoanNumber();
    const borrowFeeAmount = Number((reservation.quantity * getBorrowFeePerItem()).toFixed(2));

    if (borrowFeeAmount > 0) {
      const accountSnapshot = await prisma.$transaction((tx) => getCustomerAccountSnapshot(tx, reservation.customer_id));
      const projectedBalance = Number((accountSnapshot.availableBalance - borrowFeeAmount).toFixed(2));

      if (accountSnapshot.settings.auto_debit_borrow_fee !== true) {
        return res.status(409).json({
          message: 'Auto debit for borrow fee is disabled',
          detail: {
            borrow_fee_amount: borrowFeeAmount,
          },
        });
      }

      if (projectedBalance < accountSnapshot.minWalletBalanceRequired) {
        return res.status(409).json({
          message: 'Insufficient wallet balance for auto debit',
          detail: {
            available_balance: accountSnapshot.availableBalance,
            required_amount: borrowFeeAmount,
            min_wallet_balance_required: accountSnapshot.minWalletBalanceRequired,
          },
        });
      }
    }

    await consumeReservation({
      reservation_id: reservationId,
      loan_id: loanId,
      loan_number: loanNumber,
      warehouse_id: reservation.warehouse_id,
      idempotency_key: idempotencyKey,
      handled_by_user_id: actorUserId,
      authHeader,
    });

    const borrowDate = new Date();
    const dueDate = new Date(borrowDate.getTime() + membershipInfo.limits.max_loan_days * 24 * 60 * 60 * 1000);

    try {
      const created = await prisma.$transaction(async (tx) => {
        let debitResult = null;
        if (borrowFeeAmount > 0) {
          debitResult = await debitBorrowFee(tx, {
            customerId: reservation.customer_id,
            actorUserId,
            amount: borrowFeeAmount,
            idempotencyKey: `loan-convert:${idempotencyKey}`,
            referenceType: 'LOAN_TRANSACTION',
            referenceId: loanId,
            note: `Auto debit borrow fee for reservation ${reservation.reservation_number}`,
            metadata: {
              reservation_id: reservation.id,
              reservation_number: reservation.reservation_number,
              loan_id: loanId,
              loan_number: loanNumber,
            },
          });
        }

        const loan = await tx.loan_transactions.create({
          data: {
            id: loanId,
            loan_number: loanNumber,
            customer_id: reservation.customer_id,
            warehouse_id: reservation.warehouse_id,
            handled_by_user_id: actorUserId || reservation.created_by_user_id,
            source_reservation_id: reservation.id,
            borrow_date: borrowDate,
            due_date: dueDate,
            status: 'BORROWED',
            total_items: reservation.quantity,
          },
        });

        const loanItems = Array.from({ length: reservation.quantity }).map((_, index) => ({
          id: crypto.randomUUID(),
          loan_id: loan.id,
          variant_id: reservation.variant_id,
          inventory_unit_id: reservation.inventory_unit_id,
          item_barcode: reservation.inventory_unit_id || `${loan.loan_number}-ITEM-${index + 1}`,
          due_date: dueDate,
          status: 'BORROWED',
          item_condition_on_checkout: 'GOOD',
        }));

        await tx.loan_items.createMany({ data: loanItems });

        await tx.loan_reservations.update({
          where: { id: reservation.id },
          data: { status: 'CONVERTED_TO_LOAN' },
        });

        await writeAuditLog(tx, {
          actor_user_id: actorUserId,
          action_name: 'CONVERT_RESERVATION_TO_LOAN',
          entity_type: 'LOAN_TRANSACTION',
          entity_id: loan.id,
          before_data: reservation,
          after_data: {
            ...loan,
            source_reservation_id: reservation.id,
            idempotency_key: idempotencyKey,
            borrow_fee_amount: borrowFeeAmount,
            borrow_fee_ledger_entry_id: debitResult?.entry?.id || null,
          },
        });

        await createNotificationRecord(tx, {
          customer_id: reservation.customer_id,
          channel: 'IN_APP',
          template_code: 'LOAN_CREATED',
          subject: 'Loan created',
          body: borrowFeeAmount > 0
            ? `Reservation ${reservation.reservation_number} is converted to loan ${loan.loan_number}. Borrow fee ${borrowFeeAmount.toFixed(2)} VND was auto-debited.`
            : `Reservation ${reservation.reservation_number} is converted to loan ${loan.loan_number}.`,
          reference_type: 'LOAN_TRANSACTION',
          reference_id: loan.id,
          metadata: {
            borrow_fee_amount: borrowFeeAmount,
            borrow_fee_ledger_entry_id: debitResult?.entry?.id || null,
          },
        });

        return {
          ...loan,
          borrow_fee_amount: borrowFeeAmount,
          borrow_fee_ledger_entry_id: debitResult?.entry?.id || null,
          borrow_fee_remaining_wallet_balance: debitResult?.remainingBalance ?? null,
        };
      });

      return res.status(201).json({ data: created });
    } catch (error) {
      if (error instanceof AccountError) {
        if (error.code === 'INSUFFICIENT_FUNDS') {
          return res.status(409).json({
            message: 'Insufficient wallet balance for auto debit',
            detail: error.detail,
          });
        }

        return res.status(409).json({
          message: error.message,
          detail: error.detail || undefined,
        });
      }

      console.error('Borrow DB transaction failed after inventory consume:', error);
      return res.status(502).json({
        message: 'Loan creation failed after inventory consume. Manual reconciliation required.',
      });
    }
  } catch (error) {
    if (error?.status === 409) {
      return res.status(409).json({ message: error.message });
    }

    console.error('Error while converting reservation to loan:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function returnLoan(req, res) {
  const loanId = parseId(req.params.id);
  const actorUserId = req.user?.id || null;
  const authHeader = req.headers.authorization;
  const idempotencyKey = parseIdempotencyKey(req);
  const {
    loan_item_id,
    returned_to_location_id,
    item_condition_on_return,
    notes,
    mark_lost,
  } = req.body || {};
  const markLost = mark_lost === true;

  if (!loanId || !isUuid(loanId)) {
    return res.status(400).json({ message: 'Invalid loan id' });
  }

  if (!idempotencyKey) {
    return res.status(400).json({ message: 'Idempotency-Key header is required for return' });
  }

  if (loan_item_id && !isUuid(loan_item_id)) {
    return res.status(400).json({ message: 'loan_item_id must be a valid UUID when provided' });
  }

  if (returned_to_location_id && !isUuid(returned_to_location_id)) {
    return res.status(400).json({ message: 'returned_to_location_id must be a valid UUID when provided' });
  }

  if (markLost && !loan_item_id) {
    return res.status(400).json({ message: 'mark_lost requires loan_item_id for single-item processing' });
  }

  try {
    const loan = await prisma.loan_transactions.findUnique({
      where: { id: loanId },
      include: { loan_items: true },
    });

    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    if (!ACTIVE_LOAN_STATUSES.includes(loan.status)) {
      return res.status(409).json({ message: `Loan cannot be returned from status ${loan.status}` });
    }

    const targets = loan_item_id
      ? loan.loan_items.filter((item) => item.id === loan_item_id)
      : loan.loan_items.filter((item) => item.status === 'BORROWED' || item.status === 'OVERDUE');

    if (targets.length === 0) {
      return res.status(409).json({ message: 'No active loan items to return' });
    }

    // If this is a damage return (items reported as DAMAGED/POOR), skip returning stock
    const isDamageReturn = (item_condition_on_return || '').toUpperCase() === 'DAMAGED' || (item_condition_on_return || '').toUpperCase() === 'POOR';

    if (!markLost && !isDamageReturn) {
      for (let index = 0; index < targets.length; index += 1) {
        const item = targets[index];
        await returnBorrowedStock({
          loan_id: loan.id,
          loan_item_id: item.id,
          variant_id: item.variant_id,
          warehouse_id: loan.warehouse_id,
          quantity: 1,
          location_id: returned_to_location_id || null,
          inventory_unit_id: item.inventory_unit_id || null,
          idempotency_key: `${idempotencyKey}:${index + 1}`,
          handled_by_user_id: actorUserId,
          authHeader,
        });
      }
    }

    const returnedAt = new Date();

    const updated = await prisma.$transaction(async (tx) => {
      const membershipInfo = await resolveActiveMembership(tx, loan.customer_id);
      const targetIds = targets.map((item) => item.id);
      const targetStatus = markLost ? 'LOST' : 'RETURNED';
      await tx.loan_items.updateMany({
        where: { id: { in: targetIds } },
        data: {
          status: targetStatus,
          return_date: markLost ? null : returnedAt,
          returned_to_warehouse_id: markLost ? null : loan.warehouse_id,
          returned_to_location_id: markLost ? null : (returned_to_location_id || null),
          item_condition_on_return: item_condition_on_return || 'GOOD',
          ...(notes ? { notes: String(notes) } : {}),
        },
      });

      const fineResult = await applyReturnFines(tx, {
        customerId: loan.customer_id,
        loan,
        items: targets,
        returnedAt,
        actorUserId,
        membershipLimits: membershipInfo?.limits,
        markLost,
        itemConditionOnReturn: item_condition_on_return || 'GOOD',
      });

      const remaining = await tx.loan_items.count({
        where: {
          loan_id: loan.id,
          status: { in: ['BORROWED', 'OVERDUE', 'RESERVED'] },
        },
      });

      const loanStatus = markLost
        ? (remaining === 0 ? 'LOST' : loan.status)
        : (remaining === 0 ? 'RETURNED' : loan.status);
      const loanUpdated = await tx.loan_transactions.update({
        where: { id: loan.id },
        data: {
          status: loanStatus,
          ...(remaining === 0 ? { closed_at: returnedAt } : {}),
        },
      });

      await writeAuditLog(tx, {
        actor_user_id: actorUserId,
        action_name: 'RETURN_LOAN_ITEMS',
        entity_type: 'LOAN_TRANSACTION',
        entity_id: loan.id,
        before_data: {
          status: loan.status,
          returned_item_count: 0,
        },
        after_data: {
          status: loanStatus,
          target_status: targetStatus,
          returned_item_count: targets.length,
          generated_fine_count: fineResult.fines.length,
          total_fine_balance: fineResult.totalFineBalance,
          idempotency_key: idempotencyKey,
        },
      });

      await createNotificationRecord(tx, {
        customer_id: loan.customer_id,
        channel: 'IN_APP',
        template_code: 'LOAN_RETURNED',
        subject: remaining === 0 ? 'Loan fully returned' : 'Loan item returned',
        body: remaining === 0
          ? `Loan ${loan.loan_number} has been fully returned.`
          : `${targets.length} item(s) from loan ${loan.loan_number} have been returned.`,
        reference_type: 'LOAN_TRANSACTION',
        reference_id: loan.id,
        metadata: {
          generated_fine_count: fineResult.fines.length,
          total_fine_balance: fineResult.totalFineBalance,
          mark_lost: markLost,
        },
      });

      return {
        ...loanUpdated,
        generated_fines: fineResult.fines,
        total_fine_balance: fineResult.totalFineBalance,
      };
    });

    return res.json({ data: updated });
  } catch (error) {
    if (error?.status === 409) {
      return res.status(409).json({ message: error.message });
    }
    console.error('Error while returning loan:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function runOverdueSweepNow(req, res) {
  try {
    const result = await runOverdueSweep(prisma, {
      limit: Number(req.body?.limit || req.query?.limit || 200),
    });
    return res.json({
      message: 'Overdue sweep completed',
      data: result,
    });
  } catch (error) {
    console.error('runOverdueSweepNow error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  listLoans,
  getLoanById,
  convertReservationToLoan,
  returnLoan,
  runOverdueSweepNow,
};
