function getTodayDateOnly() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

async function resolveActiveMembership(tx, customerId) {
  const today = getTodayDateOnly();

  const membership = await tx.customer_memberships.findFirst({
    where: {
      customer_id: customerId,
      status: 'ACTIVE',
      OR: [{ end_date: null }, { end_date: { gte: today } }],
    },
    include: {
      membership_plans: true,
    },
    orderBy: [{ start_date: 'desc' }, { created_at: 'desc' }],
  });

  if (!membership || !membership.membership_plans || !membership.membership_plans.is_active) {
    return null;
  }

  return {
    membership,
    plan: membership.membership_plans,
    limits: {
      max_active_loans: membership.max_active_loans_override ?? membership.membership_plans.max_active_loans,
      max_loan_days: membership.max_loan_days_override ?? membership.membership_plans.max_loan_days,
      max_renewal_count: membership.membership_plans.max_renewal_count,
      reservation_hold_hours: membership.membership_plans.reservation_hold_hours,
      fine_per_day: Number(membership.membership_plans.fine_per_day),
      lost_item_fee_multiplier: Number(membership.membership_plans.lost_item_fee_multiplier),
    },
  };
}

module.exports = {
  resolveActiveMembership,
};
