const User = require('../models/User');
const passport = require('passport');
const RequestService = require('../services/RequestService');
const UserOps = require('../data/UserOps');

const _userOps = new UserOps();

exports.Register = async = (req, res) => {
  let reqInfo = RequestService.checkUserAuth(req);
  res.render('register', {
    title: 'Registration',
    errorMessage: '',
    user: {},
    reqInfo
  });
};

exports.RegisterUser = async (req, res) => {
  let reqInfo = RequestService.checkUserAuth(req);
  const password = req.body.password;
  const passwordConfirm = req.body.passwordConfirm;
  if (password == passwordConfirm) {
    // Creates user object with mongoose model.
    // Note that the password is not present.
    const newUser = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      username: req.body.username,
      roles: ['Registered']
    });

    // Uses passport to register the user.
    // Pass in user object without password
    // and password as next parameter.
    User.register(newUser, req.body.password, (err, account) => {
      // Show registration form with errors if fail.
      if (err) {
        return res.render('register', {
          title: 'Registration',
          user: newUser,
          errorMessage: err,
          reqInfo
        });
      }

      // User registration was successful, so let's immediately authenticate and redirect to home page.
      passport.authenticate('local')(req, res, () => {
        res.redirect(`/users/${req.body.username}`);
      });
    });
  } else {
    res.render('register', {
      title: 'Registration',
      user: {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        username: req.body.username
      },
      errorMessage: 'Passwords do not match.',
      reqInfo
    });
  }
};

exports.Login = async (req, res) => {
  let reqInfo = RequestService.checkUserAuth(req);
  let errorMessage = req.query.errorMessage;
  res.render('login', {
    title: 'Login',
    user: {},
    errorMessage: errorMessage,
    reqInfo
  });
};

exports.LoginUser = async (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: `/users/${req.body.username}`,
    failureRedirect: '/users/login?errorMessage=Invalid login.'
  })(req, res, next);
};

exports.Logout = (req, res) => {
  // Use Passports logout function
  req.logout((err) => {
    if (err) {
      return next(err);
    } else {
      let reqInfo = RequestService.checkUserAuth(req);
      // logged out. Update the reqInfo and redirect to the home page
      res.render('index', {
        title: 'Home',
        user: {},
        isLoggedIn: false,
        errorMessage: '',
        reqInfo
      });
    }
  });
};

exports.Index = async (req, res) => {
  const permittedRoles = ['Admin', 'Manager'];
  let reqInfo = RequestService.checkUserAuth(req, permittedRoles);
  if (!reqInfo.rolePermitted) {
    res.redirect(
      `/users/login?errorMessage=You must be an Admin or Manager user to access this area`
    );
  }
  const filterText = req.query.filterText ?? '';
  let users;
  if (filterText) {
    users = await _userOps.getFilteredUsers(filterText);
  } else {
    users = await _userOps.getAllUsers();
  }

  res.render('user-index', {
    title: 'Users',
    reqInfo,
    users,
    filterText,
    errorMessage: ''
  });
};

exports.UserDetail = async (req, res) => {
  let reqInfo = RequestService.checkUserAuth(req);
  if (!reqInfo.authenticated) {
    return res.redirect(
      `/users/login?errorMessage=You must login to access this area`
    );
  }

  let roles = await _userOps.getRolesByUsername(reqInfo.username);
  //add user role to req.session and reqInfo to use in further browsing
  let sessionData = req.session;
  sessionData.roles = roles;
  reqInfo.roles = roles;
  let userInfo = await _userOps.getUserInfoByUsername(req.params.username);
  return res.render('user-detail', {
    title: 'Profile',
    reqInfo,
    user: userInfo.user
  });
};

exports.Create = async (req, res) => {
  const permittedRoles = ['Admin'];
  let reqInfo = RequestService.checkUserAuth(req, permittedRoles);
  if (!reqInfo.rolePermitted) {
    res.redirect(
      `/users/login?errorMessage=You must be an Admin user to access this area`
    );
  }

  res.render('user-create-form', {
    title: 'Create User',
    reqInfo,
    user: {},
    username: '',
    errorMessage: ''
  });
};

exports.CreateUser = async (req, res) => {
  const permittedRoles = ['Admin'];
  let reqInfo = RequestService.checkUserAuth(req, permittedRoles);
  if (!reqInfo.rolePermitted) {
    res.redirect(
      `/users/login?errorMessage=You must be an Admin user to access this area`
    );
  }

  const password = req.body.password;
  const passwordConfirm = req.body.passwordConfirm;
  const userRoles = req.body.roles;
  let roles = ['Registered'];
  if (Array.isArray(userRoles)) {
    roles = roles.concat(userRoles);
  } else if (userRoles) {
    roles.push(userRoles);
  }

  const newUser = new User({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    username: req.body.username,
    roles
  });

  if (password == passwordConfirm) {
    User.register(newUser, password, (err, account) => {
      // Show user form with errors if fail.
      if (err) {
        return res.render('user-create-form', {
          title: 'Create User',
          reqInfo,
          user: newUser,
          username: '',
          errorMessage: err
        });
      } else {
        //new user created successfully, go back to user index page
        res.redirect('/users');
      }
    });
  } else {
    res.render('user-create-form', {
      title: 'Create User',
      reqInfo,
      user: newUser,
      username: '',
      errorMessage: 'Passwords do not match'
    });
  }
};

exports.Edit = async (req, res) => {
  let reqInfo = RequestService.checkUserAuth(req);
  //redirect to login page if user not logged in, not a manager or admin, or editing his/her
  //own profile
  if (
    !reqInfo.authenticated ||
    (!reqInfo.roles.some((role) => ['Admin', 'Manager'].includes(role)) &&
      req.params.username !== reqInfo.username)
  ) {
    return;
  }

  let userInfo = await _userOps.getUserInfoByUsername(req.params.username);
  return res.render('user-edit-form', {
    title: 'Edit User',
    reqInfo,
    user: userInfo.user,
    username: userInfo.user.username,
    errorMessage: ''
  });
};

exports.EditUserInfo = async (req, res) => {
  let reqInfo = RequestService.checkUserAuth(req);
  //redirect to login page if user not logged in, not a manager or admin, or editing his/her
  //own profile
  if (
    !reqInfo.authenticated ||
    (!reqInfo.roles.some((role) => ['Admin', 'Manager'].includes(role)) &&
      req.params.username !== reqInfo.username)
  ) {
    return;
  }

  let userInfo = await _userOps.getUserInfoByUsername(req.params.username);

  const userRoles = req.body.roles;
  let roles = ['Registered'];
  if (Array.isArray(userRoles)) {
    roles = roles.concat(userRoles);
  } else if (userRoles) {
    roles.push(userRoles);
  }
  //save data to database by using Ops method to interact with db
  const userObj = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    roles
  };
  const response = await _userOps.updateUserByUserName(
    userInfo.user.username,
    userObj
  );

  //if there is error, direct to edit form with error
  if (response.errorMsg != '') {
    return res.render('user-edit-form', {
      title: 'Edit User',
      reqInfo,
      user: userInfo.user,
      username: userInfo.user.username,
      errorMessage: response.errorMsg
    });
  } else {
    //no error, redirect to user profile page
    reqInfo = RequestService.checkUserAuth(req);
    userInfo = await _userOps.getUserInfoByUsername(req.params.username);
    return res.render('user-detail', {
      title: 'Profile',
      reqInfo,
      user: userInfo.user
    });
  }
};

exports.EditUserPassword = async (req, res) => {
  let reqInfo = RequestService.checkUserAuth(req);
  userInfo = await _userOps.getUserInfoByUsername(req.params.username);
  //redirect to login page if user not logged in, not a manager or admin, or editing his/her
  //own profile
  if (
    !reqInfo.authenticated ||
    (!reqInfo.roles.some((role) => ['Admin', 'Manager'].includes(role)) &&
      req.params.username !== reqInfo.username)
  ) {
    res.redirect(
      `/users/login?errorMessage=You do not have authority to change the password`
    );
  }

  const oldPassword = req.body.oldPassword;
  const newPassword = req.body.newPassword;
  const passwordConfirm = req.body.passwordConfirm;

  //only consider update password if new password fields are not empty
  if (newPassword != '' || passwordConfirm != '') {
    //if old password is given but is empty, return with error message
    if (oldPassword === '') {
      const errorMessage = 'You must enter your current password';
      return res.render('user-edit-form', {
        title: 'Edit User',
        reqInfo,
        user: userInfo.user,
        username: userInfo.user.username,
        errorMessage
      });
    }

    //if the new passwords do not match, return with error
    if (newPassword !== passwordConfirm) {
      const errorMessage = 'The new passwords do not match';
      return res.render('user-edit-form', {
        title: 'Edit User',
        reqInfo,
        user: userInfo.user,
        username: userInfo.user.username,
        errorMessage
      });
    }

    //use passport to update password
    const user = await _userOps.getUserByUsername(reqInfo.username);
    user.changePassword(oldPassword, newPassword, (err) => {
      //if error return with error message
      if (err) {
        const errorMessage = 'Current password enter is incorrect';
        console.log('error: ', err);
        return res.render('user-edit-form', {
          title: 'Edit User',
          reqInfo,
          user: userInfo.user,
          username: userInfo.user.username,
          errorMessage
        });
        //if successful, get latest reqInfo and go back to user detail page
      } else {
        reqInfo = RequestService.checkUserAuth(req);
        return res.render('user-detail', {
          title: 'Profile',
          reqInfo,
          user: userInfo.user
        });
      }
    });
  }
};

exports.DeleteUserByUsername = async (req, res) => {
  const permittedRoles = ['Admin'];
  let reqInfo = RequestService.checkUserAuth(req, permittedRoles);
  if (!reqInfo.rolePermitted) {
    res.redirect(
      `/users/login?errorMessage=You must be an Admin user to access this area`
    );
  }

  const username = req.params.username;
  let deletedUser = await _userOps.deleteUserByUsername(username);
  const users = await _userOps.getAllUsers();

  if (deletedUser) {
    res.render('user-index', {
      title: 'Users',
      reqInfo,
      users,
      filterText: '',
      errorMessage: ''
    });
  } else {
    res.render('user-index', {
      title: 'Users',
      reqInfo,
      users,
      filterText: '',
      errorMessage: 'Error. Unable to delete'
    });
  }
};
