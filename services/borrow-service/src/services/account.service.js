function normalizeMoney(value) {
  const parsed = Number(value || 0);
  if (!Number.isFinite(parsed)) return 0;
  return Number(parsed.toFixed(2));
}

class AccountError extends Error {
  constructor(code, message, detail = null) {
    super(message);
    this.name = 'AccountError';
    this.code = code;
    this.detail = detail;
  }
}

async function ensureCustomerAccount(tx, customerId) {
  const existing = await tx.customer_accounts.findUnique({ where: { customer_id: customerId } });
  if (existing) {
    return existing;
  }

  return tx.customer_accounts.create({
    data: {
      customer_id: customerId,
      currency_code: 'VND',
      status: 'ACTIVE',
    },
  });
}

async function ensureAutoPaymentSettings(tx, customerId) {
  const existing = await tx.auto_payment_settings.findUnique({ where: { customer_id: customerId } });
  if (existing) {
    return existing;
  }

  return tx.auto_payment_settings.create({
    data: {
      customer_id: customerId,
      auto_debit_borrow_fee: true,
      auto_debit_fines: false,
      allow_partial_fine_payment: true,
      min_wallet_balance_required: 0,
    },
  });
}

async function getCustomerAccountSnapshot(tx, customerId) {
  const account = await ensureCustomerAccount(tx, customerId);
  const settings = await ensureAutoPaymentSettings(tx, customerId);

  return {
    account,
    settings,
    availableBalance: normalizeMoney(account.available_balance),
    heldBalance: normalizeMoney(account.held_balance),
    minWalletBalanceRequired: normalizeMoney(settings.min_wallet_balance_required),
  };
}

async function debitBorrowFee(tx, input) {
  const {
    customerId,
    actorUserId = null,
    amount,
    idempotencyKey,
    referenceId = null,
    referenceType = 'LOAN_TRANSACTION',
    note = null,
    metadata = {},
  } = input;

  const debitAmount = normalizeMoney(amount);
  if (!idempotencyKey) {
    throw new AccountError('IDEMPOTENCY_KEY_REQUIRED', 'idempotency key is required for account debit');
  }

  if (debitAmount <= 0) {
    throw new AccountError('INVALID_AMOUNT', 'debit amount must be positive');
  }

  const { account, settings, availableBalance, minWalletBalanceRequired } = await getCustomerAccountSnapshot(tx, customerId);

  if (settings.auto_debit_borrow_fee !== true) {
    throw new AccountError('AUTO_DEBIT_DISABLED', 'auto debit for borrow fee is disabled');
  }

  const existingEntry = await tx.account_ledger.findFirst({
    where: {
      customer_id: customerId,
      idempotency_key: idempotencyKey,
      entry_type: 'DEBIT',
    },
  });

  if (existingEntry) {
    return {
      idempotent: true,
      entry: existingEntry,
      debitedAmount: normalizeMoney(existingEntry.amount),
      remainingBalance: normalizeMoney(existingEntry.balance_after),
      account,
    };
  }

  if (account.status !== 'ACTIVE') {
    throw new AccountError('ACCOUNT_NOT_ACTIVE', `customer account is ${account.status}`);
  }

  const postDebitBalance = normalizeMoney(availableBalance - debitAmount);
  if (postDebitBalance < minWalletBalanceRequired) {
    throw new AccountError('INSUFFICIENT_FUNDS', 'insufficient wallet balance for auto debit', {
      available_balance: availableBalance,
      required_amount: debitAmount,
      min_wallet_balance_required: minWalletBalanceRequired,
    });
  }

  const updatedAccount = await tx.customer_accounts.update({
    where: { id: account.id },
    data: {
      available_balance: postDebitBalance,
      total_debited: normalizeMoney(normalizeMoney(account.total_debited) + debitAmount),
      updated_at: new Date(),
    },
  });

  const ledgerEntry = await tx.account_ledger.create({
    data: {
      account_id: account.id,
      customer_id: customerId,
      entry_type: 'DEBIT',
      amount: debitAmount,
      balance_before: availableBalance,
      balance_after: postDebitBalance,
      reference_type: referenceType,
      reference_id: referenceId,
      idempotency_key: idempotencyKey,
      note,
      metadata,
      created_by_user_id: actorUserId,
    },
  });

  return {
    idempotent: false,
    entry: ledgerEntry,
    debitedAmount: debitAmount,
    remainingBalance: postDebitBalance,
    account: updatedAccount,
  };
}

async function creditAccount(tx, input) {
  const {
    customerId,
    actorUserId = null,
    amount,
    idempotencyKey,
    referenceId = null,
    referenceType = 'ACCOUNT_TOPUP',
    note = null,
    metadata = {},
  } = input;

  const creditAmount = normalizeMoney(amount);
  if (!idempotencyKey) {
    throw new AccountError('IDEMPOTENCY_KEY_REQUIRED', 'idempotency key is required for account credit');
  }

  if (creditAmount <= 0) {
    throw new AccountError('INVALID_AMOUNT', 'credit amount must be positive');
  }

  const { account, availableBalance } = await getCustomerAccountSnapshot(tx, customerId);

  const existingEntry = await tx.account_ledger.findFirst({
    where: {
      customer_id: customerId,
      idempotency_key: idempotencyKey,
      entry_type: 'CREDIT',
    },
  });

  if (existingEntry) {
    return {
      idempotent: true,
      entry: existingEntry,
      creditedAmount: normalizeMoney(existingEntry.amount),
      newBalance: normalizeMoney(existingEntry.balance_after),
      account,
    };
  }

  if (account.status !== 'ACTIVE') {
    throw new AccountError('ACCOUNT_NOT_ACTIVE', `customer account is ${account.status}`);
  }

  const postCreditBalance = normalizeMoney(availableBalance + creditAmount);

  const updatedAccount = await tx.customer_accounts.update({
    where: { id: account.id },
    data: {
      available_balance: postCreditBalance,
      total_credited: normalizeMoney(normalizeMoney(account.total_credited) + creditAmount),
      updated_at: new Date(),
    },
  });

  const ledgerEntry = await tx.account_ledger.create({
    data: {
      account_id: account.id,
      customer_id: customerId,
      entry_type: 'CREDIT',
      amount: creditAmount,
      balance_before: availableBalance,
      balance_after: postCreditBalance,
      reference_type: referenceType,
      reference_id: referenceId,
      idempotency_key: idempotencyKey,
      note,
      metadata,
      created_by_user_id: actorUserId,
    },
  });

  return {
    idempotent: false,
    entry: ledgerEntry,
    creditedAmount: creditAmount,
    newBalance: postCreditBalance,
    account: updatedAccount,
  };
}

async function listAccountLedger(tx, customerId, options = {}) {
  const page = Math.max(1, Number.parseInt(String(options.page || '1'), 10) || 1);
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(String(options.pageSize || '20'), 10) || 20));
  const skip = (page - 1) * pageSize;

  const account = await ensureCustomerAccount(tx, customerId);
  const where = { account_id: account.id };

  const [items, total] = await Promise.all([
    tx.account_ledger.findMany({
      where,
      orderBy: [{ created_at: 'desc' }],
      skip,
      take: pageSize,
    }),
    tx.account_ledger.count({ where }),
  ]);

  return {
    data: items,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 1,
    },
  };
}

module.exports = {
  AccountError,
  ensureCustomerAccount,
  ensureAutoPaymentSettings,
  getCustomerAccountSnapshot,
  debitBorrowFee,
  creditAccount,
  listAccountLedger,
};
