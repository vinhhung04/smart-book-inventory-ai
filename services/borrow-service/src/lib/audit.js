async function writeAuditLog(tx, payload) {
  await tx.borrow_audit_logs.create({
    data: {
      actor_user_id: payload.actor_user_id || null,
      action_name: payload.action_name,
      entity_type: payload.entity_type,
      entity_id: payload.entity_id || null,
      before_data: payload.before_data || null,
      after_data: payload.after_data || null,
    },
  });
}

module.exports = {
  writeAuditLog,
};
