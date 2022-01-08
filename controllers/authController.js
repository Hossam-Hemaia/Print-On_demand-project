const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const nodeMailer = require("nodemailer");
const { validationResult } = require("express-validator");
const Designer = require("../models/designer");
const Design = require("../models/design");
const Client = require("../models/client");

const transporter = nodeMailer.createTransport({
  service: "gmail",
  auth: {
    user: "hoseamhemaea80@gmail.com",
    pass: "H@23121980",
  },
});
//register page route
exports.getRegister = (req, res, next) => {
  try {
    res.status(200).render("auth/register", {
      pageTitle: "Register",
      hasError: false,
      isDesigner: false,
      isClient: false,
      oldInput: {
        oldFirstName: "",
        oldLastName: "",
        oldName: "",
        oldCountry: "",
        oldCity: "",
        oldAge: "",
        oldGender: "",
        oldEmail: "",
        oldPassword: "",
      },
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};
//registering new designer to database
exports.postDesignerRegister = async (req, res, next) => {
  const { name, country, city, age, gender, email, password } = req.body;
  console.log(name);
  const errors = validationResult(req);
  if (!errors.isEmpty() && errors.array()[0].msg !== "Invalid value") {
    return res.status(422).render("auth/register", {
      pageTitle: "Register",
      hasError: true,
      isDesigner: true,
      isClient: false,
      oldInput: {
        oldName: name,
        oldCountry: country,
        oldCity: city,
        oldAge: age,
        oldGender: gender,
        oldEmail: email,
        oldPassword: password,
      },
      errorMessage: errors.array()[0].msg,
    });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const designer = new Designer({
      name,
      location: {
        country,
        city,
      },
      age,
      gender,
      email,
      password: hashedPassword,
    });
    await designer.save();
    req.session.isLoggedIn = true;
    req.session.designer = designer;
    res.status(200).render("admin/dashBoard", {
      pageTitle: "Dash Board",
      designerId: designer._id,
      designerName: designer.name,
      designs: [],
    });
    transporter.sendMail(
      {
        to: email,
        from: "teepodteam@teepod.com",
        subject: "Congratulations! You Successfully Registered",
        html: `<h1>Lets Start Working</h1>
      <p>now you are one of our team lets start spreading our designs to the world</p>`,
      },
      (error, info) => {
        if (error) {
          console.log(error);
        } else {
          console.log("Email-Sent to: " + info.response);
        }
      }
    );
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};
//registering a new client
exports.postClientRegister = async (req, res, next) => {
  const { firstName, lastName, email, password } = req.body;
  const name = firstName + " " + lastName;
  const errors = validationResult(req);
  if (!errors.isEmpty() && errors.array()[0].msg !== "Invalid value") {
    return res.status(422).render("auth/register", {
      pageTitle: "Register",
      hasError: true,
      isDesigner: false,
      isClient: true,
      oldInput: {
        oldFirstName: firstName,
        oldLastName: lastName,
        oldEmail: email,
        oldPassword: password,
      },
      errorMessage: errors.array()[0].msg,
    });
  }
  try {
    const clientHashedPass = await bcrypt.hash(password, 12);
    const client = new Client({
      name,
      email,
      password: clientHashedPass,
    });
    await client.save();
    req.session.clientLoggedIn = true;
    req.session.client = client;
    req.session.itemsPerPage = 0;
    req.session.cartCounter = 0;
    res.redirect("/market");
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};
//login page function for both client and designer
exports.getLogin = (req, res, next) => {
  try {
    res.status(200).render("auth/login", {
      pageTitle: "Login",
      hasError: false,
      isDesigner: false,
      isClient: false,
      oldInput: {
        oldEmail: "",
        oldPassword: "",
      },
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};
//designer login function
exports.postDesignerLogin = async (req, res, next) => {
  const { email, password } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty() && errors.array()[0].msg !== "Invalid value") {
    return res.status(422).render("auth/login", {
      pageTitle: "Login",
      hasError: true,
      isDesigner: true,
      isClient: false,
      oldInput: {
        oldEmail: email,
        oldPassword: password,
      },
      errorMessage: errors.array()[0].msg,
    });
  }
  const designer = req.designer;
  req.session.designer = designer;
  req.session.isLoggedIn = true;
  try {
    const designs = await Design.find({ designerId: designer._id });
    res.status(201).render("admin/dashBoard", {
      pageTitle: "Dash Board",
      isAuthenticated: req.session.isLoggedIn,
      designs: designs,
      designerName: designer.name,
      designerId: designer._id,
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};
//client login function
exports.postClientLogin = async (req, res, next) => {
  const { email, password } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/login", {
      pageTitle: "Login",
      hasError: true,
      isClient: true,
      isDesigner: false,
      oldInput: {
        oldEmail: email,
        oldPassword: password,
      },
      errorMessage: errors.array()[0].msg,
    });
  }
  try {
    const client = req.client;
    req.session.client = client;
    req.session.clientLoggedIn = true;
    req.session.cartCounter = 0;
    req.session.itemsPerPage = 0;
    res.redirect("/market");
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};
//logout function for both designer and client
exports.getLogout = async (req, res, next) => {
  if (req.session.client) {
    req.session.cartCounter = 0;
    await req.client.clearCart();
  }
  await req.session.destroy((err) => {
    if (err) {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    }
    res.redirect("/");
  });
};
//reset page function
exports.getReset = (req, res, next) => {
  const reseterType = req.params.reseterType;
  try {
    if (reseterType === "1") {
      res.status(200).render("auth/resetPass", {
        pageTitle: "Reset Password",
        resetType: "client",
      });
    } else {
      res.status(200).render("auth/resetPass", {
        pageTitle: "Reset Password",
        resetType: "designer",
      });
    }
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.postReset = async (req, res, next) => {
  const email = req.body.email;
  const reseterType = req.body.reseterType;
  const token = crypto.randomBytes(32).toString("hex");
  const tokenExpirationDate = Date.now() + 3600000;
  try {
    if (reseterType === "designer") {
      const designer = await Designer.findOne({ email: email });
      if (!designer) {
        return res.redirect("/reset/2");
      }
      designer.resetToken = token;
      designer.resetTokenExpirationDate = tokenExpirationDate;
      await designer.save();
    } else if (reseterType === "client") {
      const client = await Client.findOne({ email: email });
      if (!client) {
        return res.redirect("/reset/1");
      }
      client.resetToken = token;
      client.resetTokenExpirationDate = tokenExpirationDate;
      await client.save();
    }
    transporter.sendMail({
      to: email,
      from: "teepodTeam@teepod.com",
      subject: "Password Reset",
      html: `
      <p>You have required to reset your passowrd please follow the link below</p>
      <p>click this <a href="http://localhost:3000/reset/${token}/${reseterType}">link</a> to reset your password</p>
      <p>best regards</p>
      `,
    });
    res.redirect("/");
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.getNewPassword = async (req, res, next) => {
  const token = req.params.token;
  const reseterType = req.params.reseterType;
  try {
    let reseterId = "";
    if (reseterType === "designer") {
      const designer = await Designer.findOne({
        resetToken: token,
        resetTokenExpirationDate: { $gt: Date.now() },
      });
      if (!designer) {
        return res.redirect("/reset/2");
      }
      reseterId = designer._id.toString();
    } else if (reseterType === "client") {
      const client = await Client.findOne({
        resetToken: token,
        resetTokenExpirationDate: { $gt: Date.now() },
      });
      if (!client) {
        return res.redirect("/reset/1");
      }
      reseterId = client._id.toString();
    }
    res.status(200).render("auth/newPassword", {
      pageTitle: "New Password Reset",
      token: token,
      reseterId: reseterId,
      reseterType: reseterType,
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.postNewPassword = async (req, res, next) => {
  const {
    newPassword,
    confirmNewPassword,
    token,
    reseterId,
    reseterType,
  } = req.body;
  if (newPassword !== confirmNewPassword) {
    return res.redirect(`/reset/${token}/${reseterType}`);
  }
  try {
    if (reseterType === "designer") {
      const designer = await Designer.findOne({
        resetToken: token,
        resetTokenExpirationDate: { $gt: Date.now() },
        _id: reseterId,
      });
      if (!designer) {
        return res.redirect("/reset/2");
      }
      const newHashedPass = await bcrypt.hash(newPassword, 12);
      designer.password = newHashedPass;
      designer.resetToken = "";
      designer.resetTokenExpirationDate = undefined;
      await designer.save();
    } else if (reseterType === "client") {
      const client = await Client.findOne({
        resetToken: token,
        resetTokenExpirationDate: { $gt: Date.now() },
        _id: reseterId,
      });
      if (!client) {
        return res.redirect("/reset/1");
      }
      const newHashedPass = await bcrypt.hash(newPassword, 12);
      client.password = newHashedPass;
      client.token = "";
      client.resetTokenExpirationDate = undefined;
      await client.save();
    }
    res.redirect("/login");
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};
