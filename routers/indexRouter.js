const express = require('express');
const indexRouter = express.Router();
const IndexController = require('../controllers/IndexController');
const InvoiceController = require('../controllers/InvoiceController');

indexRouter.get('/', IndexController.Index);

module.exports = indexRouter;
