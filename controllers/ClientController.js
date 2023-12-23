const ClientOps = require('../data/ClientOps');
const { Client } = require('../models/Client');
const RequestService = require('../services/RequestService');

const _clientOps = new ClientOps();

exports.Index = async function (req, res) {
  const permittedRoles = ['Admin', 'Manager'];
  let reqInfo = RequestService.checkUserAuth(req, permittedRoles);
  if (!reqInfo.rolePermitted) {
    res.redirect(
      `/users/login?errorMessage=You must be an Admin or Manager user to access this area`
    );
  }
  const filterText = req.query.filterText ?? '';
  let clients;
  if (filterText) {
    clients = await _clientOps.getFilteredClients(filterText);
  } else {
    clients = await _clientOps.getAllClients();
  }

  res.render('client-index', {
    title: 'Clients',
    reqInfo,
    clients,
    filterText,
    errorMessage: ''
  });
};

exports.Detail = async function (req, res) {
  const permittedRoles = ['Admin'];
  let reqInfo = RequestService.checkUserAuth(req, permittedRoles);
  if (!reqInfo.rolePermitted) {
    res.redirect(
      `/users/login?errorMessage=You must be an Admin user to access this area`
    );
  }

  const clientId = req.params.id;
  let client = await _clientOps.getClientById(clientId);
  if (client) {
    res.render('client-detail', {
      title: 'Clients - ' + client.firstName,
      reqInfo,
      clientA: client,
      clientId: req.params.id
    });
  } else {
    res.render('client-index', {
      title: 'Clients',
      reqInfo,
      clients: []
    });
  }
};

exports.Create = async function (req, res) {
  const permittedRoles = ['Admin'];
  let reqInfo = RequestService.checkUserAuth(req, permittedRoles);
  if (!reqInfo.rolePermitted) {
    res.redirect(
      `/users/login?errorMessage=You must be an Admin user to access this area`
    );
  }

  res.render('client-form', {
    title: 'Create Client',
    reqInfo,
    errorMessage: '',
    client_id: '',
    clientA: {}
  });
};

exports.CreateClient = async function (req, res) {
  const permittedRoles = ['Admin'];
  let reqInfo = RequestService.checkUserAuth(req, permittedRoles);
  if (!reqInfo.rolePermitted) {
    res.redirect(
      `/users/login?errorMessage=You must be an Admin user to access this area`
    );
  }

  let tempClientObj = new Client({
    name: req.body.name,
    code: req.body.code,
    company: req.body.company,
    email: req.body.email
  });

  let response = await _clientOps.createClient(tempClientObj);
  if (response.errorMsg == '') {
    let clients = await _clientOps.getAllClients();
    res.render('client-index', {
      title: 'Clients',
      reqInfo,
      clients: clients,
      filterText: '',
      errorMessage: ''
    });
  } else {
    res.render('client-form', {
      title: 'Create Profile',
      reqInfo,
      clientA: response.obj,
      errorMessage: response.errorMsg,
      client_id: ''
    });
  }
};

exports.Edit = async function (req, res) {
  const permittedRoles = ['Admin'];
  let reqInfo = RequestService.checkUserAuth(req, permittedRoles);
  if (!reqInfo.rolePermitted) {
    res.redirect(
      `/users/login?errorMessage=You must be an Admin user to access this area`
    );
  }

  const clientId = req.params.id;
  let clientObj = await _clientOps.getClientById(clientId);
  res.render('client-form', {
    title: 'Edit Client',
    reqInfo,
    errorMessage: '',
    client_id: clientId,
    clientA: clientObj
  });
};

exports.EditClient = async function (req, res) {
  const permittedRoles = ['Admin'];
  let reqInfo = RequestService.checkUserAuth(req, permittedRoles);
  if (!reqInfo.rolePermitted) {
    res.redirect(
      `/users/login?errorMessage=You must be an Admin user to access this area`
    );
  }

  const clientId = req.body.client_id;
  const name = req.body.name;
  const code = req.body.code;
  const company = req.body.company;
  const email = req.body.email;
  // send these to profileOps to update and save the document
  let response = await _clientOps.updateClientById(
    clientId,
    name,
    code,
    company,
    email
  );

  // if no errors, save was successful
  if (response.errorMsg == '') {
    let clients = await _clientOps.getAllClients();
    res.render('client-index', {
      title: 'Clients',
      reqInfo,
      clients: clients,
      filterText: '',
      errorMessage: ''
    });
  }
  // There are errors. Show form the again with an error message.
  else {
    res.render('client-form', {
      title: 'Edit Client',
      reqInfo,
      clientA: response.obj,
      client_id: clientId,
      errorMessage: response.errorMsg
    });
  }
};

exports.DeleteClientById = async function (req, res) {
  const permittedRoles = ['Admin'];
  let reqInfo = RequestService.checkUserAuth(req, permittedRoles);
  if (!reqInfo.rolePermitted) {
    res.redirect(
      `/users/login?errorMessage=You must be an Admin user to access this area`
    );
  }

  const clientId = req.params.id;
  let deletedClient = await _clientOps.deleteClientById(clientId);
  let clients = await _clientOps.getAllClients();

  if (deletedClient) {
    res.render('client-index', {
      title: 'Clients',
      reqInfo,
      clients: clients,
      filterText: '',
      errorMessage: ''
    });
  } else {
    res.render('client-index', {
      title: 'Clients',
      reqInfo,
      clients: clients,
      errorMessage: 'Error.  Unable to Delete'
    });
  }
};
