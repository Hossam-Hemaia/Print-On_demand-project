const { body } = require("express-validator");

module.exports = {
  validateName: body("name")
    .isString()
    .trim()
    .withMessage("Name must be only text"),
  validateFirstName: body("firstName")
    .isString()
    .trim()
    .withMessage("Name must be only text"),
  validateLastName: body("lastName")
    .isString()
    .trim()
    .withMessage("Name must be only text"),
  validateCountry: body("country")
    .isString()
    .trim()
    .withMessage("Name must be only text"),
  validateCity: body("city")
    .isString()
    .trim()
    .withMessage("Name must be only text"),
  validateAge: body("age")
    .isNumeric()
    .isInt()
    .withMessage("Age should be an integer"),
  validateEmail: body("email")
    .trim()
    .normalizeEmail()
    .isEmail()
    .withMessage("Invalid Email"),
  validatePassword: body("password")
    .isLength({ min: 6 })
    .withMessage("password must be 6 charachters at least."),
  validateConfirmPassword: body("confirmPassword")
    .isLength({ min: 6 })
    .withMessage("password must be 6 charachters at least."),
  validateTitle: body("title")
    .isString()
    .isLength({ min: 3 })
    .trim()
    .withMessage("Title must be 3 charachters at least"),
  validtePrice: body("price").isNumeric().isFloat().toFloat(),
  validateDescription: body("description")
    .isString()
    .isLength({ min: 10 })
    .withMessage("Descripe your desing in 10 charachters at least"),
  validateOldPassword: body("oldPassword")
    .isLength({ min: 6 })
    .withMessage("password must be 6 charachter at least."),
  validateNewPassword: body("newPassword")
    .isLength({ min: 6 })
    .withMessage("new password must be 6 charachter at least."),
  validateConfirmNewPassword: body("confirmNewPassword")
    .isLength({ min: 6 })
    .withMessage("password must be 6 charachters at least."),
};
