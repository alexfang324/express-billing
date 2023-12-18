class RequestService {
  // Constructor
  RequestService() {}

  checkUserAuth = (req, res, permittedRoles = []) => {
    console.log('resssssssss: ', res);

    // restrict permissions by default
    let rolePermitted = false;

    // Send username and login status to view if authenticated.
    if (req.isAuthenticated()) {
      if (req.session.roles) {
        // check if the user's roles matches any of the permitted roles for this resource
        let matchingRoles = req.session.roles?.filter((role) =>
          permittedRoles.includes(role)
        );
        if (matchingRoles.length > 0) {
          rolePermitted = true;
        }
      } else {
        req.session.roles = [];
      }

      //if not authorized, redirect to login page with error message
      if (rolePermitted) {
        return {
          authenticated: true,
          username: req.user.username,
          roles: req.session.roles,
          rolePermitted: rolePermitted
        };
      } else {
        res.redirect(
          `/users/login?errorMessage=You must be a ${permittedRoles.join(
            '/'
          )} user to access this area.`
        );
        return {
          rolePermitted: false,
          authorized: false
        };
      }
    } else {
      res.redirect(
        `/users/login?errorMessage=You must login to access this area.`
      );
      return {
        authenticated: false,
        rolePermitted: false
      };
    }
  };
}
module.exports = new RequestService();
