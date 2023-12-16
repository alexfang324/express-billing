const User = require('../models/User');

class UserData {
  // Constructor
  UserData() {}

  async getUserByUsername(username) {
    let user = await User.findOne({ username: username });
    return user;
  }

  //retrieve public facing user informations (no password or _id)
  async getUserInfoByUsername(username) {
    let user = await User.findOne(
      { username: username },
      { _id: 0, username: 1, email: 1, firstName: 1, lastName: 1 }
    );
    if (user) {
      const response = { user: user, errorMessage: '' };
      return response;
    } else {
      return null;
    }
  }

  async getRolesByUsername(username) {
    let user = await User.findOne({ username: username }, { _id: 0, roles: 1 });
    if (user.roles) {
      return user.roles;
    } else {
      return [];
    }
  }

  async updateProfileByUserName(username, formData) {
    const user = await User.findOne({ username: username });
    for (const key in formData) {
      user[key] = formData[key];
    }

    //validate object before saving to database
    const error = user.validateSync();
    if (error) {
      const response = {
        obj: user,
        errorMsg: error.message
      };
      return response;
    }
    //validation passed, save to db
    const result = await user.save();
    const response = {
      obj: result,
      errorMsg: ''
    };
    return response;
  }
}

module.exports = UserData;
