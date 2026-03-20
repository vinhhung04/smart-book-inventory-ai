const express = require('express');

const {
  getAllWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
} = require('../controllers/warehouse.controller');
const { getZonesAndBinsByWarehouse } = require('../controllers/location.controller');
const { authorizeAnyPermission } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', authorizeAnyPermission(['inventory.stock.read', 'inventory.stock.write']), getAllWarehouses);
router.get('/:id', authorizeAnyPermission(['inventory.stock.read', 'inventory.stock.write']), getWarehouseById);
router.post('/', authorizeAnyPermission(['inventory.stock.write']), createWarehouse);
router.put('/:id', authorizeAnyPermission(['inventory.stock.write']), updateWarehouse);
router.delete('/:id', authorizeAnyPermission(['inventory.stock.write']), deleteWarehouse);
router.get('/:warehouseId/locations', authorizeAnyPermission(['inventory.stock.read', 'inventory.stock.write']), getZonesAndBinsByWarehouse);

module.exports = router;