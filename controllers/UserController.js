const User = require('../models/User');
const passport = require('passport');
const RequestService = require('../services/RequestService');
const UserOps = require('../data/UserOps');

const _userOps = new UserOps();

exports.Register = async = (req, res) => {
  let reqInfo = RequestService.getCurrentUser(req);
  res.render('register', {
    title: 'Registration',
    errorMessage: '',
    user: {},
    reqInfo: reqInfo
  });
};

exports.RegisterUser = async (req, res) => {
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
        let reqInfo = RequestService.getCurrentUser(req);
        return res.render('register', {
          user: newUser,
          errorMessage: err,
          reqInfo: reqInfo
        });
      }

      // User registration was successful, so let's immediately authenticate and redirect to home page.
      passport.authenticate('local')(req, res, () => {
        res.redirect('/');
      });
    });
  } else {
    let reqInfo = RequestService.getCurrentUser(req);
    res.render('register', {
      user: {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        username: req.body.username
      },
      errorMessage: 'Passwords do not match.',
      reqInfo: reqInfo
    });
  }
};

exports.Login = async (req, res) => {
  let reqInfo = RequestService.getCurrentUser(req);
  let errorMessage = req.query.errorMessage;
  res.render('login', {
    title: 'Login',
    user: {},
    errorMessage: errorMessage,
    reqInfo: reqInfo
  });
};

exports.LoginUser = async (req, res, next) => {
  let reqInfo = RequestService.getCurrentUser(req);
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
      // logged out. Update the reqInfo and redirect to the login page
      let reqInfo = RequestService.getCurrentUser(req);
      res.render('index', {
        title: 'Home',
        user: {},
        isLoggedIn: false,
        errorMessage: '',
        reqInfo: reqInfo
      });
    }
  });
};

exports.Profile = async (req, res) => {
  let reqInfo = RequestService.getCurrentUser(req);
  if (reqInfo.authenticated) {
    let roles = await _userOps.getRolesByUsername(reqInfo.username);
    //add user role to req.session and reqInfo
    let sessionData = req.session;
    sessionData.roles = roles;
    reqInfo.roles = roles;
    let userInfo = await _userOps.getUserInfoByUsername(reqInfo.username);
    return res.render('profile', {
      title: 'Profile',
      reqInfo: reqInfo,
      userInfo: userInfo
    });
  } else {
    res.redirect(
      '/users/login?errorMessage=You must be logged in to view this page.'
    );
  }
};

exports.Edit = async (req, res) => {
  let reqInfo = RequestService.getCurrentUser(req);
  let userInfo = await _userOps.getUserInfoByUsername(reqInfo.username);

  return res.render('profile-edit', {
    title: 'Edit User',
    reqInfo,
    userInfo,
    errorMessage: ''
  });
};

exports.EditProfile = async (req, res) => {
  let reqInfo = RequestService.getCurrentUser(req);
  let userInfo = await _userOps.getUserInfoByUsername(reqInfo.username);

  //save data to database by using Ops method to interact with db
  const userObj = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email
  };
  const response = await _userOps.updateProfileByUserName(
    reqInfo.username,
    userObj
  );

  //if there is error, direct to edit form with error
  if (response.errorMsg != '') {
    return res.render('profile-edit', {
      title: 'Edit User',
      reqInfo: reqInfo,
      userInfo: userInfo,
      errorMessage: response.errorMsg
    });
  }

  //if no error, check if we need to update password as well
  const oldPassword = req.body.oldPassword;
  const newPassword = req.body.newPassword;
  const passwordConfirm = req.body.passwordConfirm;
  //get the newest userInfo
  userInfo = await _userOps.getUserInfoByUsername(reqInfo.username);

  //only consider update password if new password fields are not empty
  if (newPassword != '' || passwordConfirm != '') {
    //if old password not given
    if (oldPassword === '') {
      const errorMessage = 'You must enter your current password';
      return res.render('profile-edit', {
        title: 'Edit User',
        reqInfo,
        userInfo,
        errorMessage
      });
    }

    //if the new passwords do not match, return with error
    if (newPassword !== passwordConfirm) {
      const errorMessage = 'The new passwords do not match';
      return res.render('profile-edit', {
        title: 'Edit User',
        reqInfo,
        userInfo,
        errorMessage
      });
    }

    //use passport to update password
    const user = await _userOps.getUserByUsername(reqInfo.username);
    user.changePassword(oldPassword, newPassword, (err) => {
      if (err) {
        const errorMessage = 'Current password enter is incorrect';
        console.log('error: ', err);
        return res.render('profile-edit', {
          title: 'Edit User',
          reqInfo,
          userInfo,
          errorMessage
        });
      } else {
        return res.render('profile', {
          title: 'Profile',
          reqInfo,
          userInfo
        });
      }
    });
  } else {
    return res.render('profile', {
      title: 'Profile',
      reqInfo,
      userInfo
    });
  }
};

exports.Index = async (req, res) => {
  const filterText = req.query.filterText ?? '';
  const reqInfo = RequestService.getCurrentUser(req);
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
  let reqInfo = RequestService.getCurrentUser(req);
  if (reqInfo.authenticated) {
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
  } else {
    res.redirect(
      '/users/login?errorMessage=You must be logged in to view this page.'
    );
  }
};

exports.Create = async (req, res) => {
  const reqInfo = RequestService.getCurrentUser(req);
  res.render('user-form', {
    title: 'Create User',
    reqInfo,
    user: {},
    username: '',
    errorMessage: ''
  });
};

exports.CreateUser = async (req, res) => {
  let reqInfo = RequestService.getCurrentUser(req);
  const password = req.body.password;
  const passwordConfirm = req.body.passwordConfirm;
  const userRoles = req.body.roles;
  let roles = ['Registered'];
  if (Array.isArray(userRoles)) {
    roles = roles.concat(userRoles);
  } else if (userRoles) {
    roles.push(userRoles);
  }

  if (password == passwordConfirm) {
    const newUser = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      username: req.body.username,
      roles
    });
    User.register(newUser, req.body.password, (err, account) => {
      // Show user form with errors if fail.
      if (err) {
        return res.render('user-form', {
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
    res.render('user-form', {
      title: 'Create User',
      reqInfo,
      user: newUser,
      username: '',
      errorMessage: 'Passwords do not match'
    });
  }
};

exports.Edit = async (req, res) => {
  let reqInfo = RequestService.getCurrentUser(req);
  let userInfo = await _userOps.getUserInfoByUsername(req.params.username);
  return res.render('user-form', {
    title: 'Edit User',
    reqInfo,
    user: userInfo.user,
    username: userInfo.user.username,
    errorMessage: ''
  });
};

exports.EditUser = async (req, res) => {
  let reqInfo = RequestService.getCurrentUser(req);
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
    return res.render('user-form', {
      title: 'Edit User',
      reqInfo,
      user: userObj,
      username: userInfo.user.username,
      errorMessage: response.errorMsg
    });
  }

  //if no error, check if we need to update password as well
  const oldPassword = req.body.oldPassword ?? null;
  const newPassword = req.body.newPassword;
  const passwordConfirm = req.body.passwordConfirm;
  //get the newest userInfo
  userInfo = await _userOps.getUserInfoByUsername(req.params.username);

  //only consider update password if new password fields are not empty
  if (newPassword != '' || passwordConfirm != '') {
    //if old password is given but is empty, return with error message
    if (oldPassword === '') {
      const errorMessage = 'You must enter your current password';
      return res.render('user-form', {
        title: 'Edit User',
        reqInfo,
        user: userObj,
        username: userInfo.user.username,
        errorMessage
      });
    }

    //if the new passwords do not match, return with error
    if (newPassword !== passwordConfirm) {
      const errorMessage = 'The new passwords do not match';
      return res.render('user-form', {
        title: 'Edit User',
        reqInfo,
        user: userObj,
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
        return res.render('user-form', {
          title: 'Edit User',
          reqInfo,
          user: userObj,
          username: userInfo.user.username,
          errorMessage
        });
        //if successful, get latest reqInfo and go back to user detail page
      } else {
        reqInfo = RequestService.getCurrentUser(req);
        return res.render('user-detail', {
          title: 'Profile',
          reqInfo,
          user: userInfo.user
        });
      }
    });
    //if no new password is given, get latest reqInfo and userInfo then go back to user detail page
  } else {
    reqInfo = RequestService.getCurrentUser(req);
    userInfo = await _userOps.getUserInfoByUsername(req.params.username);
    return res.render('user-detail', {
      title: 'Profile',
      reqInfo,
      user: userInfo.user
    });
  }
};

exports.DeleteUserByUsername = async (req, res) => {
  const reqInfo = RequestService.getCurrentUser(req);
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
