const express = require('express');
const {
  listCustomers,
  createCustomer,
  getCustomerById,
  updateCustomer,
  getActiveMembership,
  getMyProfile,
  updateMyProfile,
  getMyMembership,
} = require('../controllers/customer.controller');
const { authorizeAnyPermission } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/me/profile', getMyProfile);
router.patch('/me/profile', updateMyProfile);
router.get('/me/membership', getMyMembership);

router.get('/', authorizeAnyPermission(['borrow.read', 'borrow.write']), listCustomers);
router.post('/', authorizeAnyPermission(['borrow.write']), createCustomer);
router.get('/:id', authorizeAnyPermission(['borrow.read', 'borrow.write']), getCustomerById);
router.patch('/:id', authorizeAnyPermission(['borrow.write']), updateCustomer);
router.get('/:id/membership/active', authorizeAnyPermission(['borrow.read', 'borrow.write']), getActiveMembership);

module.exports = router;
