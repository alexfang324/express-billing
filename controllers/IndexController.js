const RequestService = require('../services/RequestService');

exports.Index = async (req, res) => {
  let reqInfo = RequestService.checkUserAuth(req);
  return res.render('index', { title: 'Home', reqInfo });
};
