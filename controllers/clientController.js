const fs = require("fs");
const path = require("path");
const stripe = require("stripe")(
  "sk_test_51HfswkEOhvYlT1YsZme0NHkxRjeGvKAxFc6MqFV9ZaGD07LH9FXAXb4g6KGvu5TnCGK1WbQtXwSvnszUXEXgHQhQ00OPG1i8fS"
);

const Design = require("../models/design");
const Orders = require("../models/orders");

exports.getMarket = async (req, res, next) => {
  if (req.params.itemPerPage) {
    req.session.itemsPerPage = +req.params.itemPerPage;
  }
  let ITEMS_PER_PAGE = req.session.itemsPerPage || 20;
  let page = +req.query.page || 1;
  let totalItems;
  try {
    totalItems = await Design.find({ published: true }).countDocuments();
    const designs = await Design.find({ published: true })
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);
    if (!designs) {
      res.redirect("/");
    }
    res.status(200).render("client/market", {
      pageTitle: "Market",
      designs,
      itemPerPage: ITEMS_PER_PAGE,
      currentPage: page,
      hasNextPage: page * ITEMS_PER_PAGE < totalItems,
      hasPreviousPage: page > 1,
      nextPage: page + 1,
      previousPage: page - 1,
      lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.getDesignDetails = async (req, res, next) => {
  const designId = req.params.designId;
  try {
    const design = await Design.findById(designId);
    const designs = await Design.find({ published: true });
    if (!design) {
      res.redirect("/market");
    }
    res.status(200).render("client/details", {
      pageTitle: "Design Details",
      design,
      designs,
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.getAddToCart = async (req, res, next) => {
  const designId = req.params.designId;
  try {
    const design = await Design.findById(designId);
    if (!design) {
      res.redirect("/market");
    }
    req.client.addToCart(design);
    ++req.session.cartCounter;
    let counter = req.session.cartCounter;
    const io = require("../socket").getIO();
    io.emit("addedToCart", { counter });
    res.json({ message: "Added to cart" });
  } catch (err) {
    console.log(err);
    res.status(422).json({ message: "Add to cart faild" });
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.getCart = async (req, res, next) => {
  try {
    const client = await req.client
      .populate("cart.items.designId")
      .execPopulate();
    const designs = client.cart.items;
    res.render("client/cart", {
      pageTitle: "Client Cart",
      designs,
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.postDeleteCartItem = async (req, res, next) => {
  const designId = req.body.designId;
  const designQuantity = req.body.designQuantity;
  try {
    await req.client.removeCartItem(designId);
    req.session.cartCounter -= designQuantity;
    res.redirect("/cart");
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.getCheckOut = async (req, res, next) => {
  let designs;
  let total = 0;
  try {
    const client = await req.client
      .populate("cart.items.designId")
      .execPopulate();
    designs = client.cart.items;
    designs.forEach((d) => {
      total += d.quantity * d.designId.price;
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: designs.map((d) => {
        return {
          name: d.designId.title,
          description: d.designId.description,
          amount: Math.floor(d.designId.price * 100),
          currency: "usd",
          quantity: d.quantity,
        };
      }),
      success_url: req.protocol + "://" + req.get("host") + "/checkOut/success",
      cancel_url: req.protocol + "://" + req.get("host") + "/checkOut/cancel",
      mode: "payment",
    });
    res.status(201).render("client/checkOut", {
      pageTitle: "Checkout Orders",
      designs: designs,
      totalSum: total,
      sessionId: session.id,
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.getCheckOutSuccess = async (req, res, next) => {
  try {
    const client = await req.client
      .populate("cart.items.designId")
      .execPopulate();
    const designs = client.cart.items.map((d) => {
      return { designId: { ...d.designId._doc }, quantity: d.quantity };
    });
    const order = new Orders({
      client: {
        clientId: client._id,
        email: client.email,
      },
      designs: designs,
    });
    await order.save();
    designs.forEach(async (d) => {
      let soldDesign = await Design.findById(d.designId._id);
      soldDesign.soldCounter += d.quantity;
      await soldDesign.save();
    });
    await req.client.clearCart();
    res.redirect("/orders");
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    const orders = await Orders.find({ "client.clientId": req.client._id });
    if (!orders) {
      res.redirect("/market");
    }
    res
      .status(200)
      .render("client/orders", { pageTitle: "Orders", orders: orders });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.getDownloadDesign = async (req, res, next) => {
  const orderId = req.params.orderId;
  const designName = req.params.designName;
  try {
    const order = await Orders.findOne({
      _id: orderId,
    });
    if (!order) {
      throw new Error("this order does not exist");
    }
    if (order.client.clientId.toString() !== req.client._id.toString()) {
      throw new Error("You are not authorized to downaload this design");
    }
    const designPath = path.join("originalDesigns", designName);
    const imageBuffer = fs.createReadStream(designPath);
    res.setHeader("Content-Type", "application/png");
    res.setHeader("Content-Desposition", `attachment; filename=${designName}`);
    imageBuffer.pipe(res);
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};
