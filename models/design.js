const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const designSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  imagePath: {
    type: String,
    required: true,
  },
  originalImagePath: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  published: {
    type: Boolean,
    default: false,
  },
  soldCounter: {
    type: Number,
    default: 0,
  },
  designerId: {
    type: Schema.Types.ObjectId,
    ref: "Designer",
    required: true,
  },
});

module.exports = mongoose.model("Design", designSchema);
