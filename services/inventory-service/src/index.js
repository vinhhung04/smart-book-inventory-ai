require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { authenticateToken } = require('./middlewares/auth.middleware');
const bookRoutes = require('./routes/book.routes');
const warehouseRoutes = require('./routes/warehouse.routes');
const goodsReceiptRoutes = require('./routes/goods-receipt.routes');
const stockMovementRoutes = require('./routes/stock-movement.routes');
const borrowIntegrationRoutes = require('./routes/borrow-integration.routes');

const app = express();
const PORT = process.env.PORT || 3001;
const JSON_BODY_LIMIT = process.env.JSON_BODY_LIMIT || '8mb';

app.use(cors());
app.use(express.json({ limit: JSON_BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: JSON_BODY_LIMIT }));

// Only API routes require JWT.
app.use('/api', authenticateToken);

app.use('/api/books', bookRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/goods-receipts', goodsReceiptRoutes);
app.use('/api/stock-movements', stockMovementRoutes);
app.use('/api/borrow-integration', borrowIntegrationRoutes);

// Return JSON for oversized request payloads (e.g. base64 cover image uploads).
app.use((err, req, res, next) => {
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({
      message: `Payload quá lớn. Vui lòng dùng ảnh nhỏ hơn hoặc nén ảnh trước khi upload (giới hạn hiện tại: ${JSON_BODY_LIMIT}).`,
    });
  }

  return next(err);
});

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Inventory Service running on http://localhost:${PORT}`);
});
