const RequestService = require('../services/RequestService');

exports.Index = async (req, res) => {
  return res.render('index', { title: 'Home', reqInfo: {} });
};
