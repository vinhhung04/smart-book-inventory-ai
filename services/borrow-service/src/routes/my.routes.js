const express = require('express');
const {
  getMyReservations,
  createMyReservation,
  cancelMyReservation,
  getMyLoans,
  getMyLoanById,
  requestMyLoanRenewal,
  getMyAccount,
  topupMyAccount,
  getMyAccountLedger,
  getMyFines,
  payMyFine,
  getMyNotifications,
} = require('../controllers/my.controller');

const router = express.Router();

router.get('/profile', require('../controllers/customer.controller').getMyProfile);
router.patch('/profile', require('../controllers/customer.controller').updateMyProfile);
router.get('/membership', require('../controllers/customer.controller').getMyMembership);

router.get('/reservations', getMyReservations);
router.post('/reservations', createMyReservation);
router.patch('/reservations/:id/cancel', cancelMyReservation);

router.get('/loans', getMyLoans);
router.get('/loans/:id', getMyLoanById);
router.post('/loans/:id/renew-request', requestMyLoanRenewal);

router.get('/account', getMyAccount);
router.post('/account/topup', topupMyAccount);
router.get('/account/ledger', getMyAccountLedger);
router.get('/fines', getMyFines);
router.post('/fines/payments', payMyFine);
router.get('/notifications', getMyNotifications);

module.exports = router;
