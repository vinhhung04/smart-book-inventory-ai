const express = require('express');

const {
  getWarehouseReceivings,
  getReceivingItems,
  getCompartmentCandidates,
  lookupCompartmentByBarcode,
  lookupVariantByBarcode,
  getOccupiedCompartments,
  getCompartmentItems,
  transferReceivingToShelf,
  reverseShelfToReceiving,
} = require('../controllers/receiving-putaway.controller');
const { authorizeAnyPermission } = require('../middlewares/auth.middleware');

const router = express.Router();
const canOperateStock = authorizeAnyPermission(['inventory.stock.write']);

router.get('/warehouses/:warehouseId/receivings', canOperateStock, getWarehouseReceivings);
router.get('/receivings/:receivingId/items', canOperateStock, getReceivingItems);
router.get('/receivings/:receivingId/candidates', canOperateStock, getCompartmentCandidates);
router.get('/lookup/location-by-barcode', canOperateStock, lookupCompartmentByBarcode);
router.get('/lookup/variant-by-barcode', canOperateStock, lookupVariantByBarcode);
router.get('/warehouses/:warehouseId/compartments/occupied', canOperateStock, getOccupiedCompartments);
router.get('/compartments/:compartmentId/items', canOperateStock, getCompartmentItems);
router.post('/transfer', canOperateStock, transferReceivingToShelf);
router.post('/reverse', canOperateStock, reverseShelfToReceiving);

module.exports = router;
