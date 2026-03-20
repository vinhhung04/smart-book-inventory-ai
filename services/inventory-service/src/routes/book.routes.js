const express = require('express');

const {
	getAllBooks,
	getBookById,
	findBookByBarcode,
	createIncompleteBook,
	updateBookDetails,
} = require('../controllers/book.controller');
const { authorizeAnyPermission } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', authorizeAnyPermission(['inventory.catalog.read', 'inventory.catalog.write']), getAllBooks);
router.get('/barcode/:barcode', authorizeAnyPermission(['inventory.catalog.read', 'inventory.catalog.write']), findBookByBarcode);
router.post('/incomplete', authorizeAnyPermission(['inventory.catalog.write']), createIncompleteBook);
router.get('/:id', authorizeAnyPermission(['inventory.catalog.read', 'inventory.catalog.write']), getBookById);
router.patch('/:id', authorizeAnyPermission(['inventory.catalog.write']), updateBookDetails);

module.exports = router;