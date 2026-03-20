const express = require('express');

const {
	getGoodsReceipts,
	getGoodsReceiptById,
	createGoodsReceipt,
	updateGoodsReceipt,
} = require('../controllers/goods-receipt.controller');
const { authorizeAnyPermission } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', authorizeAnyPermission(['inventory.stock.read', 'inventory.stock.write']), getGoodsReceipts);
router.get('/:id', authorizeAnyPermission(['inventory.stock.read', 'inventory.stock.write']), getGoodsReceiptById);
router.post('/', authorizeAnyPermission(['inventory.stock.write']), createGoodsReceipt);
router.patch('/:id', authorizeAnyPermission(['inventory.stock.write']), updateGoodsReceipt);

module.exports = router;
