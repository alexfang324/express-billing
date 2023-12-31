class RequestService {
  // Constructor
  RequestService() {}

  checkUserAuth = (req, permittedRoles = []) => {
    // restrict permissions by default
    let rolePermitted = false;

    // check if user is authenticated
    if (req.isAuthenticated()) {
      //if user has a role, check it against the permitted roles for this page
      if (req.session.roles) {
        let matchingRoles = req.session.roles?.filter((role) =>
          permittedRoles.includes(role)
        );
        if (matchingRoles.length > 0) {
          rolePermitted = true;
        }
      } else {
        req.session.roles = [];
      }
      //if permitted role is empty, an authenticated user is also authorized to visit that page
      if (permittedRoles.length === 0) {
        rolePermitted = true;
      }

      //if authorized, return with authentication and authorization information
      if (rolePermitted) {
        return {
          authenticated: true,
          username: req.user.username,
          roles: req.session.roles,
          rolePermitted
        };
      } else {
        //if not authorized
        return {
          authenticated: true,
          username: req.user.username,
          roles: req.session.roles,
          rolePermitted: false
        };
      }
    } else {
      //not authenticated
      return {
        authenticated: false,
        rolePermitted: false
      };
    }
  };
}
module.exports = new RequestService();
