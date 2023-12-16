const { Product } = require('../models/Product.js');

class ProductOps {
  ProductOps() {}

  async getAllProducts() {
    const products = await Product.find({}).sort({ name: 1 });
    return products;
  }

  async getProductById(id) {
    if (!id || id === undefined || id === '') {
      return null;
    }
    const product = await Product.findById(id);
    return product;
  }

  async createProduct(productObj) {
    try {
      //if form data is invalid, return response with error
      const error = await productObj.validateSync();
      if (error) {
        const response = {
          obj: productObj,
          errorMsg: error.message
        };
        return response;
      }

      // Model is valid, save it to db
      const result = await productObj.save();
      const response = {
        obj: result,
        errorMsg: ''
      };
      return response;
    } catch (error) {
      const response = {
        obj: productObj,
        errorMsg: error.message
      };
      return response;
    }
  }

  async updateProductById(id, formData) {
    const product = await Product.findById(id);
    for (const key in formData) {
      product[key] = formData[key];
    }

    //validate object before saving to database
    const error = await product.validateSync();
    if (error) {
      const response = {
        obj: product,
        errorMsg: error.message
      };
      return response;
    }
    //validation passed, save to db
    const result = await product.save();
    const response = {
      obj: result,
      errorMsg: ''
    };
    return response;
  }

  async deleteProductById(id) {
    let result = await Product.findByIdAndDelete(id);
    return result;
  }

  //use a regular expression with case insensitive option to filter the product list
  async getFilteredProducts(filterText) {
    let result = await Product.find({
      name: { $regex: `.*${filterText}.*`, $options: 'i' }
    });
    return result;
  }
}

module.exports = ProductOps;
