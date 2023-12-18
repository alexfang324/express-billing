const { Invoice } = require('../models/Invoice');
const InvoiceOps = require('../data/InvoiceOps');
const ClientOps = require('../data/ClientOps');
const ProductOps = require('../data/ProductOps');
const RequestService = require('../services/RequestService');

const _invoiceOps = new InvoiceOps();
const _clientOps = new ClientOps();
const _productOps = new ProductOps();

exports.Index = async function (req, res) {
  const reqInfo = RequestService.checkUserAuth(req, res, ['Manager', 'Admin']);
  const filterText = req.query.filterText ?? '';
  let invoices;
  if (filterText) {
    invoices = await _invoiceOps.getFilteredInvoices(
      reqInfo.username,
      filterText
    );
  } else {
    invoices = await _invoiceOps.getAllUserInvoices(reqInfo.username);
  }

  res.render('invoice-index', {
    title: 'Invoices',
    reqInfo,
    invoices,
    filterText: '',
    errorMessage: ''
  });
};

exports.Detail = async function (req, res) {
  const reqInfo = RequestService.checkUserAuth(req);
  const invoice = await _invoiceOps.getInvoiceById(req.params.id);
  let invoiceTotal = 0;
  invoice.products.forEach((product, i) => {
    invoiceTotal += product.unit_cost * invoice.quantities[i];
  });

  res.render('invoice-detail', {
    title: `Invoice - ${invoice.invoiceNumber}`,
    reqInfo,
    invoice,
    invoiceTotal
  });
};

exports.Create = async function (req, res) {
  const reqInfo = RequestService.checkUserAuth(req);
  const clientList = await _clientOps.getAllClients();
  const productList = await _productOps.getAllProducts();
  res.render('invoice-form', {
    title: 'Create Invoice',
    reqInfo,
    errorMessage: '',
    invoiceId: null,
    invoice: {},
    clientList,
    productList,
    numProdRows: 1
  });
};

exports.CreateInvoice = async function (req, res) {
  const reqInfo = RequestService.checkUserAuth(req);
  const invoiceClient = await _clientOps.getClientById(req.body.clientId);
  const productIds = req.body['productId[]'];
  const quantities = req.body['quantity[]'];
  const products = await _invoiceOps.constructInvoiceProducts(productIds);

  let formObj = new Invoice({
    invoiceId: null,
    invoiceNumber: req.body.invoiceNumber,
    invoiceDate: req.body.invoiceDate,
    dueDate: req.body.dueDate,
    invoiceClient,
    products,
    quantities
  });

  const response = await _invoiceOps.createInvoice(formObj);

  if (response.errorMsg == '') {
    const invoices = await _invoiceOps.getAllUserInvoices(reqInfo.username);
    res.render('invoice-index', {
      title: 'Invoices',
      reqInfo,
      invoices,
      filterText: '',
      errorMessage: ''
    });
  }
  // There are errors. Show form the again with an error message.
  else {
    const clientList = await _clientOps.getAllClients();
    const productList = await _productOps.getAllProducts();

    res.render('invoice-form', {
      title: 'Create Invoice',
      reqInfo,
      errorMessage: response.errorMsg,
      invoiceId: null,
      invoice: response.obj,
      clientList,
      productList,
      numProdRows: req.body.numProdRows
    });
  }
};

exports.Edit = async function (req, res) {
  const reqInfo = RequestService.checkUserAuth(req);
  const clientList = await _clientOps.getAllClients();
  const productList = await _productOps.getAllProducts();
  const invoiceId = req.params.id;
  const invoice = await _invoiceOps.getInvoiceById(invoiceId);
  res.render('invoice-form', {
    title: 'Create Invoice',
    reqInfo,
    errorMessage: '',
    invoiceId,
    invoice,
    clientList,
    productList,
    numProdRows: invoice.products.length
  });
};

exports.EditInvoice = async function (req, res) {
  const reqInfo = RequestService.checkUserAuth(req);
  const invoiceId = req.body.invoiceId;
  const invoiceClient = await _clientOps.getClientById(req.body.clientId);

  const productIds = req.body['productId[]'];
  const quantities = req.body['quantity[]'];

  const products = await _invoiceOps.constructInvoiceProducts(productIds);

  let formObj = {
    invoiceId,
    invoiceNumber: req.body.invoiceNumber,
    invoiceDate: req.body.invoiceDate,
    dueDate: req.body.dueDate,
    invoiceClient,
    products,
    quantities
  };

  //try to update an invoice object and add to database
  response = await _invoiceOps.updateInvoiceById(invoiceId, formObj);

  // if no errors, it was udpated and save to db successfully
  if (response.errorMsg == '') {
    const invoices = await _invoiceOps.getAllUserInvoices(reqInfo.username);
    res.render('invoice-index', {
      title: 'Invoices',
      reqInfo,
      invoices,
      filterText: '',
      errorMessage: ''
    });
  }
  // There are errors. Show form the again with an error message.
  else {
    const clientList = await _clientOps.getAllClients();
    const productList = await _productOps.getAllProducts();

    res.render('invoice-form', {
      title: 'Edit Invoice',
      reqInfo,
      errorMessage: response.errorMsg,
      invoiceId,
      invoice: response.obj,
      clientList,
      productList,
      numProdRows: req.body.numProdRows
    });
  }
};

exports.DeleteInvoiceById = async function (req, res) {
  const reqInfo = RequestService.checkUserAuth(req);
  const invoiceId = req.params.id;
  let deletedInvoice = await _invoiceOps.deleteInvoiceById(invoiceId);
  const invoices = await _invoiceOps.getAllUserInvoices(reqInfo.username);

  if (deletedInvoice) {
    res.render('invoice-index', {
      title: 'Invoices',
      reqInfo,
      invoices,
      filterText: '',
      errorMessage: ''
    });
  } else {
    res.render('invoice-index', {
      title: 'Invoices',
      reqInfo,
      invoices,
      filterText: '',
      errorMessage: 'Error.  Unable to Delete'
    });
  }
};

exports.TooglePaid = async (req, res) => {
  const reqInfo = RequestService.checkUserAuth(req);
  const filterText = req.query.filterText ?? '';
  const invoiceId = req.params.id;
  const invoice = await _invoiceOps.getInvoiceById(invoiceId);
  //calculate new paid status and update it to the database
  const updateObj = { paid: invoice.paid ? false : true };
  response = await _invoiceOps.updateInvoiceById(invoiceId, updateObj);

  // if error, set a general error message to return to user
  let errorMessage = '';
  if (response.errorMsg != '') {
    errorMessage = "An error occured, can't change invoice paid status";
  }
  //if filterText was used, maintain the filtered result
  let invoices;
  if (filterText) {
    invoices = await _invoiceOps.getFilteredInvoices(
      reqInfo.username,
      filterText
    );
  } else {
    invoices = await _invoiceOps.getAllUserInvoices(reqInfo.username);
  }

  res.render('invoice-index', {
    title: 'Invoices',
    reqInfo,
    invoices,
    filterText: '',
    errorMessage
  });
};
