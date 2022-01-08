const express = require("express");
const { body } = require("express-validator");
const bcrypt = require("bcryptjs");
const adminController = require("../controllers/adminController");
const isAuth = require("../validations/is-auth");
const Designer = require("../models/designer");
const validator = require("../validations/validation");

const router = express.Router();

router.get("/dashBoard", isAuth.authDesigner, adminController.getDashBoard);

router.get(
  "/designer/bestPractices",
  isAuth.authDesigner,
  adminController.getBestPractices
);

router.get(
  "/designer/addDesign",
  isAuth.authDesigner,
  adminController.getAddDesign
);

router.post(
  "/designer/addDesign",
  [
    validator.validateTitle,
    validator.validtePrice,
    validator.validateDescription,
  ],
  isAuth.authDesigner,
  adminController.postAddDesign
);

router.get(
  "/designer/editDesign/:designId",
  isAuth.authDesigner,
  adminController.getEditDesign
);

router.post(
  "/designer/editDesign",
  [
    validator.validateTitle,
    validator.validtePrice,
    validator.validateDescription,
  ],
  isAuth.authDesigner,
  adminController.postEditDesign
);

router.delete(
  "/designer/:designId",
  isAuth.authDesigner,
  adminController.deleteDesign
);

router.get(
  "/designer/changePass",
  isAuth.authDesigner,
  adminController.getChangePassword
);

router.post(
  "/changePass",
  [
    validator.validateOldPassword.custom(async (value, { req }) => {
      const designer = await Designer.findOne({ _id: req.body.designerId });
      const doMatch = await bcrypt.compare(value, designer.password);
      if (!doMatch) {
        throw new Error("Incorrect old password!");
      }
    }),
    validator.validateNewPassword,
    validator.validateConfirmNewPassword.custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("new password does not match");
      }
      return true;
    }),
  ],
  isAuth.authDesigner,
  adminController.postChangePassword
);

router.get(
  "/designer/profile",
  isAuth.authDesigner,
  adminController.getDesignerProfile
);

router.post(
  "/designer/saveChanges",
  [validator.validateName, validator.validateAge],
  isAuth.authDesigner,
  adminController.postDesignerProfile
);

module.exports = router;
