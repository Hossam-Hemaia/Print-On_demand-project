const express = require("express");
const clientController = require("../controllers/clientController");
const isAuth = require("../validations/is-auth");

const router = express.Router();

router.get("/market", clientController.getMarket);

router.get("/market/:itemPerPage", clientController.getMarket);

router.get(
  "/market/designDetails/:designId",
  clientController.getDesignDetails
);

router.get(
  "/addToCart/:designId",
  isAuth.authClient,
  clientController.getAddToCart
);

router.get("/cart", isAuth.authClient, clientController.getCart);

router.post(
  "/deleteCartItem",
  isAuth.authClient,
  clientController.postDeleteCartItem
);

router.get("/checkOut", isAuth.authClient, clientController.getCheckOut);

router.get(
  "/checkOut/success",
  isAuth.authClient,
  clientController.getCheckOutSuccess
);

router.get("checkOut/cancel", isAuth.authClient, clientController.getCheckOut);

router.get("/orders", isAuth.authClient, clientController.getOrders);

router.get(
  "/:orderId/originalDesigns/:designName",
  isAuth.authClient,
  clientController.getDownloadDesign
);

module.exports = router;
