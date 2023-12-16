const express = require('express');
const productRouter = express.Router();
const ProductController = require('../controllers/ProductController');

productRouter.get('/', ProductController.Index);
productRouter.get('/edit', ProductController.Create);
productRouter.post('/edit', ProductController.CreateProduct);
productRouter.get('/edit/:id', ProductController.Edit);
productRouter.post('/edit/:id', ProductController.EditProduct);
productRouter.get('/:id', ProductController.Detail);
productRouter.get('/:id/delete', ProductController.DeleteProductById);

module.exports = productRouter;
