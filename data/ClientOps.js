const { Client } = require('../models/Client.js');

class ClientOps {
  ClientOps() {}

  async getAllClients() {
    const clients = await Client.find({}).sort({ name: 1 });
    return clients;
  }

  async getClientById(id) {
    if (!id || id === undefined || id === '') {
      return null;
    }

    let client = await Client.findById(id);
    return client;
  }

  async updateClientById(id, name, code, company, email) {
    const clientObj = await Client.findById(id);

    clientObj.name = name;
    clientObj.code = code;
    clientObj.company = company;
    clientObj.email = email;

    const error = await clientObj.validateSync();
    if (error == '') {
      const response = {
        obj: clientObj,
        errorMsg: error.message
      };
      return response; // Exit if the model is invalid
    }

    try {
      const error = await clientObj.validateSync();
      if (error) {
        const response = {
          obj: clientObj,
          errorMsg: error.message
        };
        return response;
      }

      // Model is valid, so save it
      const result = await clientObj.save();
      const response = {
        obj: result,
        errorMsg: ''
      };
      return response;
    } catch (error) {
      const response = {
        obj: clientObj,
        errorMsg: error.message
      };
      return response;
    }
  }

  async createClient(clientObj) {
    try {
      const error = await clientObj.validateSync();
      if (error == '') {
        const response = {
          obj: clientObj,
          errorMsg: error.message
        };
        return response; // Exit if the model is invalid
      }
      // Model is valid, so save it
      const result = await clientObj.save();
      const response = {
        obj: result,
        errorMsg: ''
      };
      return response;
    } catch (error) {
      const response = {
        obj: clientObj,
        errorMsg: error.message
      };
      return response;
    }
  }

  async deleteClientById(id) {
    let result = await Client.findByIdAndDelete(id);
    return result;
  }

  async getFilteredClients(filterText) {
    let result = await Client.find({
      name: { $regex: `.*${filterText}.*`, $options: 'i' }
    });
    return result;
  }
}

module.exports = ClientOps;
