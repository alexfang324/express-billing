const express = require('express');
const clientRouter = express.Router();
const clientController = require('../controllers/ClientController');

clientRouter.get('/', clientController.Index);

clientRouter.get('/edit', clientController.Create);
clientRouter.post('/edit', clientController.CreateClient);
clientRouter.get('/:id', clientController.Detail);

clientRouter.get('/:id/delete', clientController.DeleteClientById);

clientRouter.get('/edit/:id', clientController.Edit);
clientRouter.post('/edit/:id', clientController.EditClient);

module.exports = clientRouter;
