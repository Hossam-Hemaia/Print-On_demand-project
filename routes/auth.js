const express = require("express");
const bcrypt = require("bcryptjs");
const authController = require("../controllers/authController");
const isNotAuth = require("../validations/is-notAuth");
const Designer = require("../models/designer");
const Client = require("../models/client");
const validator = require("../validations/validation");

const router = express.Router();

router.get("/register", isNotAuth, authController.getRegister);

router.post(
  "/designer-register",
  [
    validator.validateName,
    validator.validateCountry,
    validator.validateCity,
    validator.validateAge,
    validator.validateEmail.custom(async (value, { req }) => {
      if (req.url === "/designer-register") {
        const designer = await Designer.findOne({ email: value });
        if (designer) {
          throw new Error("Email is already registered.");
        }
      }
    }),
    validator.validatePassword,
    validator.validateConfirmPassword.custom((value, { req }) => {
      if (req.url === "/designer-register") {
        if (value !== req.body.password) {
          throw new Error("passwords does not match");
        }
        return true;
      }
    }),
  ],
  authController.postDesignerRegister
);

router.post(
  "/client-register",
  [
    validator.validateFirstName,
    validator.validateLastName,
    validator.validateEmail.custom(async (value, { req }) => {
      if (req.url === "/client-register") {
        const client = await Client.findOne({ email: value });
        if (client) {
          throw new Error("Email is already registered.");
        }
      }
    }),
    validator.validatePassword,
    validator.validateConfirmPassword.custom((value, { req }) => {
      if (req.url === "/client-register") {
        if (value !== req.body.password) {
          throw new Error("passwords does not match");
        }
        return true;
      }
    }),
  ],
  authController.postClientRegister
);

router.get("/login", isNotAuth, authController.getLogin);

router.post(
  "/designerLogin",
  [
    validator.validateEmail.custom(async (value, { req }) => {
      if (req.url === "/designerLogin") {
        const existeingDesigner = await Designer.findOne({ email: value });
        if (!existeingDesigner) {
          throw new Error("Email is not registered.");
        }
        req.designer = existeingDesigner;
      }
    }),
    validator.validatePassword.custom(async (value, { req }) => {
      if (req.url === "/designerLogin") {
        const doMatch = await bcrypt.compare(value, req.designer.password);
        if (!doMatch) {
          throw new Error("Incorrect password");
        }
      }
    }),
  ],
  authController.postDesignerLogin
);

router.post(
  "/clientLogin",
  [
    validator.validateEmail.custom(async (value, { req }) => {
      if (req.url === "/clientLogin") {
        const existeingClient = await Client.findOne({ email: value });
        if (!existeingClient) {
          throw new Error("Email is not registered.");
        }
        req.client = existeingClient;
      }
    }),
    validator.validatePassword.custom(async (value, { req }) => {
      if (req.url === "/clientLogin") {
        const doMatch = await bcrypt.compare(value, req.client.password);
        if (!doMatch) {
          throw new Error("Incorrect password");
        }
      }
    }),
  ],
  authController.postClientLogin
);

router.get("/logout", authController.getLogout);

router.get("/reset/:reseterType", authController.getReset);

router.post(
  "/reset-designer",
  [validator.validateEmail],
  authController.postReset
);

router.post(
  "/reset-client",
  [validator.validateEmail],
  authController.postReset
);

router.get("/reset/:token/:reseterType", authController.getNewPassword);

router.post("/newPassword", authController.postNewPassword);

module.exports = router;
