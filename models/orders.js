const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ordersSchema = new Schema({
  client: {
    clientId: { type: Schema.Types.ObjectId, required: true, ref: "Client" },
    email: { type: String, required: true },
  },
  designs: [
    {
      designId: { type: Object, required: true },
      quantity: { type: Number, required: true },
    },
  ],
});

module.exports = mongoose.model("Orders", ordersSchema);
