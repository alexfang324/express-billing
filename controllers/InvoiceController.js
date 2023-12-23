const { Invoice } = require('../models/Invoice');
const InvoiceOps = require('../data/InvoiceOps');
const ClientOps = require('../data/ClientOps');
const ProductOps = require('../data/ProductOps');
const UserOps = require('../data/UserOps');

const RequestService = require('../services/RequestService');

const _invoiceOps = new InvoiceOps();
const _clientOps = new ClientOps();
const _productOps = new ProductOps();
const _userOps = new UserOps();

exports.Index = async function (req, res) {
  let reqInfo = RequestService.checkUserAuth(req);
  if (!reqInfo.authenticated) {
    res.redirect(
      `/users/login?errorMessage=You must login to access this area`
    );
  }

  const filterText = req.query.filterText ?? '';

  //if user is manager or admin, do not filter invoice by username
  const filterUser = reqInfo.roles.some((role) =>
    ['Admin', 'Manager'].includes(role)
  )
    ? null
    : reqInfo.username;
  let invoices;
  if (filterText) {
    invoices = await _invoiceOps.getFilteredInvoices(filterUser, filterText);
  } else {
    invoices = await _invoiceOps.getAllUserInvoices(filterUser);
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
  const permittedRoles = ['Admin', 'Manager'];
  let reqInfo = RequestService.checkUserAuth(req, permittedRoles);
  const invoice = await _invoiceOps.getInvoiceById(req.params.id);
  const userInfo = await _userOps.getUserInfoByUsername(reqInfo.username);

  if (
    !reqInfo.rolePermitted &&
    userInfo.user.email !== invoice.invoiceClient.email
  ) {
    res.redirect(
      `/users/login?errorMessage=You must be an Admin or Manager user to see this invoice`
    );
  }

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
  const permittedRoles = ['Admin', 'Manager'];
  let reqInfo = RequestService.checkUserAuth(req, permittedRoles);
  if (!reqInfo.rolePermitted) {
    res.redirect(
      `/users/login?errorMessage=You must be an Admin or Manager user to access this area`
    );
  }

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
  const permittedRoles = ['Admin', 'Manager'];
  let reqInfo = RequestService.checkUserAuth(req, permittedRoles);
  if (!reqInfo.rolePermitted) {
    res.redirect(
      `/users/login?errorMessage=You must be an Admin or Manager user to access this area`
    );
  }

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
    const filterUser = reqInfo.roles.some((role) =>
      permittedRoles.includes(role)
    )
      ? null
      : reqInfo.username;
    const invoices = await _invoiceOps.getAllUserInvoices(filterUser);
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
  const permittedRoles = ['Admin', 'Manager'];
  let reqInfo = RequestService.checkUserAuth(req, permittedRoles);
  if (!reqInfo.rolePermitted) {
    res.redirect(
      `/users/login?errorMessage=You must be an Admin or Manager user to access this area`
    );
  }

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
  const permittedRoles = ['Admin', 'Manager'];
  let reqInfo = RequestService.checkUserAuth(req, permittedRoles);
  if (!reqInfo.rolePermitted) {
    res.redirect(
      `/users/login?errorMessage=You must be an Admin or Manager user to access this area`
    );
  }

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
    const filterUser = reqInfo.roles.some((role) =>
      permittedRoles.includes(role)
    )
      ? null
      : reqInfo.username;
    const invoices = await _invoiceOps.getAllUserInvoices(filterUser);
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
  const permittedRoles = ['Admin', 'Manager'];
  let reqInfo = RequestService.checkUserAuth(req, permittedRoles);
  if (!reqInfo.rolePermitted) {
    res.redirect(
      `/users/login?errorMessage=You must be an Admin or Manager user to access this area`
    );
  }

  const invoiceId = req.params.id;
  let deletedInvoice = await _invoiceOps.deleteInvoiceById(invoiceId);
  const filterUser = reqInfo.roles.some((role) => permittedRoles.includes(role))
    ? null
    : reqInfo.username;
  const invoices = await _invoiceOps.getAllUserInvoices(filterUser);

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
  const permittedRoles = ['Admin', 'Manager'];
  let reqInfo = RequestService.checkUserAuth(req, permittedRoles);
  if (!reqInfo.rolePermitted) {
    res.redirect(
      `/users/login?errorMessage=You must be an Admin or Manager user to access this area`
    );
  }

  const filterText = req.query.filterText ?? '';

  //if user is manager or admin, do not filter invoice by username
  const filterUser = reqInfo.roles.some((role) =>
    ['Admin', 'Manager'].includes(role)
  )
    ? null
    : reqInfo.username;

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
    invoices = await _invoiceOps.getFilteredInvoices(filterUser, filterText);
  } else {
    invoices = await _invoiceOps.getAllUserInvoices(filterUser);
  }

  res.render('invoice-index', {
    title: 'Invoices',
    reqInfo,
    invoices,
    filterText: '',
    errorMessage
  });
};
