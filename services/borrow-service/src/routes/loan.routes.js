const express = require('express');
const {
  listLoans,
  getLoanById,
  convertReservationToLoan,
  returnLoan,
  runOverdueSweepNow,
} = require('../controllers/loan.controller');
const { authorizeAnyPermission } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', authorizeAnyPermission(['borrow.read', 'borrow.write']), listLoans);
router.get('/:id', authorizeAnyPermission(['borrow.read', 'borrow.write']), getLoanById);
router.post('/from-reservation/:id', authorizeAnyPermission(['borrow.write']), convertReservationToLoan);
router.post('/:id/return', authorizeAnyPermission(['borrow.write']), returnLoan);
router.post('/jobs/overdue-sweep', authorizeAnyPermission(['borrow.write']), runOverdueSweepNow);

module.exports = router;
