const mongoose = require('mongoose');

const clientSchema = mongoose.Schema(
  {
    name: { type: String, unique: true, required: true },
    code: { type: String, unique: true, required: true },
    company: { type: String, required: true },
    email: {
      type: String,
      required: true,
      validate: [emailValidator, 'email provided is not in correct format']
    }
  },
  { collection: 'clients' }
);

function emailValidator(value) {
  return /^\S+@\S+\.\S+$/.test(value);
}

const Client = mongoose.model('Client', clientSchema);

module.exports = { Client, clientSchema };
