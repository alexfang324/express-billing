const RequestService = require('../services/RequestService');

exports.Index = async function (req, res) {
  let reqInfo = RequestService.getCurrentUser(req);
  return res.render('index', { title: 'Home', reqInfo: reqInfo });
};
