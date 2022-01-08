const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const designerSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  location: {
    country: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
  },
  age: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  resetToken: String,
  resetTokenExpirationDate: Date,
  password: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Designer", designerSchema);
