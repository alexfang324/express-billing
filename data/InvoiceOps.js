const { Invoice } = require('../models/Invoice.js');
const ProductOps = require('./ProductOps.js');

class InvoiceOps {
  InvoiceOps() {}

  async getAllInvoices() {
    const invoices = await Invoice.find({}).sort({ name: 1 });
    return invoices;
  }

  async getInvoiceById(id) {
    if (!id || id === undefined || id === '') {
      return null;
    }

    const invoice = await Invoice.findById(id);
    return invoice;
  }

  async createInvoice(invoiceObj) {
    try {
      //if form data is invalid, return response with error
      const error = await invoiceObj.validateSync();
      if (error) {
        const response = {
          obj: invoiceObj,
          errorMsg: error.message
        };
        return response;
      }

      // Model is valid, save it to db
      const result = await invoiceObj.save();
      const response = {
        obj: result,
        errorMsg: ''
      };
      return response;
    } catch (error) {
      const response = {
        obj: invoiceObj,
        errorMsg: error.message
      };
      return response;
    }
  }

  async updateInvoiceById(id, formData) {
    const invoice = await Invoice.findById(id);
    for (const key in formData) {
      invoice[key] = formData[key];
    }

    //validate object before saving to database
    const error = await invoice.validateSync();
    if (error) {
      const response = {
        obj: invoice,
        errorMsg: error.message
      };
      return response;
    }
    //validation passed, save to db
    const result = await invoice.save();
    const response = {
      obj: result,
      errorMsg: ''
    };
    return response;
  }

  async deleteInvoiceById(id) {
    let result = await Invoice.findByIdAndDelete(id);
    return result;
  }

  async constructInvoiceProducts(productIds, quantities) {
    const _productOps = new ProductOps();

    //build the products list needed for creating a new invoice
    let products = [];
    //if user enter a number of products, then the form variables will be a list else they
    //are single values and we can't loops through them
    if (Array.isArray(productIds)) {
      for (let i = 0; i < productIds.length; i++) {
        const product = await _productOps.getProductById(productIds[i]);
        products.push(product);
      }
    } else {
      const product = await _productOps.getProductById(productIds);
      products = [product];
    }
    return products;
  }

  async getFilteredInvoices(filterText) {
    let result = await Invoice.find({
      'invoiceClient.name': { $regex: `.*${filterText}.*`, $options: 'i' }
    });
    return result;
  }
}

module.exports = InvoiceOps;
