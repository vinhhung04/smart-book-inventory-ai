const express = require('express');
const {
  listFines,
  getFineById,
  recordFinePayment,
  waiveFine,
} = require('../controllers/fine.controller');
const { authorizeAnyPermission } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', authorizeAnyPermission(['borrow.read', 'borrow.write']), listFines);
router.get('/:id', authorizeAnyPermission(['borrow.read', 'borrow.write']), getFineById);
router.post('/:id/payments', authorizeAnyPermission(['borrow.write']), recordFinePayment);
router.patch('/:id/waive', authorizeAnyPermission(['borrow.write']), waiveFine);

module.exports = router;
