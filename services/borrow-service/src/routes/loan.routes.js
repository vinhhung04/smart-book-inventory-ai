const express = require('express');
const {
  listLoans,
  getLoanById,
  createDirectLoan,
  convertReservationToLoan,
  listRenewalRequests,
  reviewLoanRenewal,
  returnLoan,
  runOverdueSweepNow,
} = require('../controllers/loan.controller');
const { authorizeAnyPermission } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', authorizeAnyPermission(['borrow.read', 'borrow.write']), listLoans);
router.get('/renewal-requests', authorizeAnyPermission(['borrow.read', 'borrow.write']), listRenewalRequests);
router.post('/direct', authorizeAnyPermission(['borrow.write']), createDirectLoan);
router.post('/:id/renewals/review', authorizeAnyPermission(['borrow.write']), reviewLoanRenewal);
router.get('/:id', authorizeAnyPermission(['borrow.read', 'borrow.write']), getLoanById);
router.post('/from-reservation/:id', authorizeAnyPermission(['borrow.write']), convertReservationToLoan);
router.post('/:id/return', authorizeAnyPermission(['borrow.write']), returnLoan);
router.post('/jobs/overdue-sweep', authorizeAnyPermission(['borrow.write']), runOverdueSweepNow);

module.exports = router;
