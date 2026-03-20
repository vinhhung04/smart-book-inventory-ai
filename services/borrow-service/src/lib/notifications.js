async function createNotificationRecord(tx, payload) {
  await tx.customer_notifications.create({
    data: {
      customer_id: payload.customer_id,
      channel: payload.channel || 'IN_APP',
      template_code: payload.template_code || null,
      subject: payload.subject || null,
      body: payload.body,
      reference_type: payload.reference_type || null,
      reference_id: payload.reference_id || null,
      status: payload.status || 'PENDING',
      metadata: payload.metadata || {},
    },
  });
}

module.exports = {
  createNotificationRecord,
};
