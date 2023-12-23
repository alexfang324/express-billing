const express = require('express');
const userRouter = express.Router();
const UserController = require('../controllers/UserController');

userRouter.get('/', UserController.Index);
userRouter.get('/register', UserController.Register);
userRouter.post('/register', UserController.RegisterUser);
userRouter.get('/login', UserController.Login);
userRouter.post('/login', UserController.LoginUser);
userRouter.get('/logout', UserController.Logout);
userRouter.get('/edit', UserController.Create);
userRouter.post('/edit', UserController.CreateUser);
userRouter.get('/edit/:username', UserController.Edit);
userRouter.post('/edit-info/:username', UserController.EditUserInfo);
userRouter.post('/edit-pwd/:username', UserController.EditUserPassword);
userRouter.get('/:username', UserController.UserDetail);
userRouter.get('/:username/delete', UserController.DeleteUserByUsername);

module.exports = userRouter;
