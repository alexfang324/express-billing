const express = require('express');
const invoiceRouter = express.Router();
const InvoiceController = require('../controllers/InvoiceController');

invoiceRouter.get('/', InvoiceController.Index);
invoiceRouter.get('/edit', InvoiceController.Create);
invoiceRouter.post('/edit', InvoiceController.CreateInvoice);
invoiceRouter.get('/edit/:id', InvoiceController.Edit);
invoiceRouter.post('/edit/:id', InvoiceController.EditInvoice);
invoiceRouter.get('/:id', InvoiceController.Detail);
invoiceRouter.get('/:id/delete', InvoiceController.DeleteInvoiceById);
module.exports = invoiceRouter;
