const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const clientSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  resetToken: String,
  resetTokenExpirationDate: Date,
  cart: {
    items: [
      {
        designId: { type: Schema.Types.ObjectId, ref: "Design" },
        quantity: { type: Number, required: true },
      },
    ],
  },
});

clientSchema.methods.addToCart = function (design) {
  const designIndex = this.cart.items.findIndex((designIdx) => {
    if (designIdx.designId.toString() === design._id.toString()) {
      return designIdx;
    }
  });
  let newQuantity = 1;
  let newCartItems = [...this.cart.items];
  if (designIndex >= 0) {
    newQuantity = this.cart.items[designIndex].quantity + 1;
    newCartItems[designIndex].quantity = newQuantity;
  } else {
    newCartItems.push({ designId: design._id, quantity: newQuantity });
  }
  const updatedCart = { items: newCartItems };
  this.cart = updatedCart;
  return this.save();
};

clientSchema.methods.removeCartItem = function (designId) {
  const updatedCartItems = this.cart.items.filter((item) => {
    return item.designId.toString() !== designId.toString();
  });
  this.cart.items = updatedCartItems;
  return this.save();
};

clientSchema.methods.clearCart = function () {
  this.cart = { items: [] };
  return this.save();
};

module.exports = new mongoose.model("Client", clientSchema);
