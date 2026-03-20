const express = require('express');
const { provisionCustomerFromAuth } = require('../controllers/customer.controller');

const router = express.Router();

router.post('/provision', provisionCustomerFromAuth);

module.exports = router;
