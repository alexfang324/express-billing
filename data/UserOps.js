const User = require('../models/User');

class UserData {
  // Constructor
  UserData() {}

  async getAllUsers() {
    const users = await User.find({});
    return users;
  }

  async getFilteredUsers(filterText) {
    const _userOps = new userOps();
    let result = await User.find({
      username: {
        $regex: `.*${filterText}.*`,
        $options: 'i'
      }
    }).sort({ username: 1 });
    return result;
  }

  async getUserByUsername(username) {
    let user = await User.findOne({ username: username });
    return user;
  }

  //retrieve public facing user informations (no password or _id)
  async getUserInfoByUsername(username) {
    let user = await User.findOne(
      { username: username },
      { _id: 0, username: 1, email: 1, firstName: 1, lastName: 1, roles: 1 }
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

  async updateUserByUserName(username, formData) {
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

  // async updateUserByUserName(username, formData) {
  //   let newUser = {};
  //   for (const key in formData) {
  //     newUser[key] = formData[key];
  //   }
  //   const user = await User.updateOne({ username: username }, newUser, {
  //     upsert: true
  //   }).catch((error) => {
  //     console.log('Errorrrrrrrr: ', error);
  //     const response = {
  //       obj: newUser,
  //       errorMsg: error
  //     };
  //     return response;
  //   });

  //   //update successful
  //   const response = {
  //     obj: user,
  //     errorMsg: ''
  //   };
  //   return response;
  // }

  async deleteUserByUsername(username) {
    const user = await User.findOneAndDelete({ username: username });
    return user;
  }
}

module.exports = UserData;
