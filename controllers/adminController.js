const sharp = require("sharp");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const Design = require("../models/design");
const Designer = require("../models/designer");
const deleteFile = require("../utils/deletefile");

exports.getBestPractices = (req, res, next) => {
  try {
    res.status(200).render("admin/merch", { pageTitle: "Best Practices" });
  } catch (err) {
    const error = new Error(err);
    error.getStatusCode = 500;
    return next(error);
  }
};

exports.getAddDesign = (req, res, next) => {
  try {
    res.status(200).render("admin/addDesign", {
      pageTitle: "Upload Design",
      hasError: false,
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.postAddDesign = async (req, res, next) => {
  let showImage;
  const { title, price, description, published, tshirtColor } = req.body;
  let isPublished = published === "on" ? true : false;
  const image = req.file;
  if (!image) {
    return res.status(422).render("admin/addDesign", {
      pageTitle: "Upload Design",
      hasError: true,
      design: {
        title,
        price,
        description,
      },
      errorMessage: "Uploaded file is not a '.png' image or no image uploaded!",
      validationError: [],
    });
  }
  try {
    const imageParse = sharp(image.path);
    const imageData = await imageParse.metadata();
    if (imageData.density < 300) {
      return res.status(422).render("admin/addDesign", {
        pageTitle: "Upload Design",
        hasError: true,
        design: {
          title,
          price,
          description,
        },
        errorMessage: "Image doesn't meet quality requirements!",
        validationError: [],
      });
    }
    const imageBuffer = await imageParse
      .resize({ fit: "fill", width: 200, height: 240 })
      .toBuffer({ resolveWithObject: true });
    showImage = sharp(`./tshirts-colors/${tshirtColor}.jpg`)
      .composite([{ input: imageBuffer.data, left: 220, top: 170 }])
      .webp({ quality: 90 })
      .toFile(`./images/${image.filename}.webp`, (err) => {
        if (err) {
          console.log(err);
        }
      });
  } catch (err) {
    console.log(err);
    res.status(500).redirect("/dashBoard");
  }
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("admin/addDesign", {
      pageTitle: "Upload Design",
      hasError: true,
      design: {
        title,
        price,
        description,
      },
      errorMessage: errors.array()[0].msg,
      validationError: errors.array(),
    });
  }
  const design = new Design({
    title,
    price,
    imagePath: showImage.options.fileOut,
    originalImagePath: image.path,
    description,
    designerId: req.designer,
    published: isPublished,
  });
  try {
    await design.save();
    res.status(200).redirect("/dashBoard");
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.getDashBoard = async (req, res, next) => {
  try {
    const designs = await Design.find({ designerId: req.designer._id });
    res.status(201).render("admin/dashBoard", {
      pageTitle: "Dash Board",
      designs: designs,
      designerId: req.designer._id,
      designerName: req.designer.name,
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.getEditDesign = async (req, res, next) => {
  const designId = req.params.designId;
  try {
    const design = await Design.findById(designId);
    res.status(200).render("admin/editDesign", {
      pageTitle: "Edit Design",
      hasError: false,
      design: design,
      errorMessage: "",
      validationError: [],
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.postEditDesign = async (req, res, next) => {
  let showImage;
  const {
    title,
    price,
    description,
    published,
    designId,
    tshirtColor,
  } = req.body;
  const design = await Design.findById(designId);
  if (design.designerId.toString() !== req.designer._id.toString()) {
    return res.status(500).render("home");
  }
  const isPublished = published === "on" ? true : false;
  const image = req.file;
  if (image) {
    deleteFile(design.imagePath);
    deleteFile(design.originalImagePath);
    try {
      const imageParse = sharp(image.path);
      const imageData = await imageParse.metadata();
      if (imageData.density < 300) {
        return res.status(422).render("admin/editDesign", {
          pageTitle: "Upload Design",
          hasError: true,
          design: {
            title,
            price,
            description,
            published,
            _id: designId,
          },
          errorMessage: "Image doesn't meet quality requirements!",
          validationError: [],
        });
      }
      const imageBuffer = await imageParse
        .resize({ fit: "fill", width: 200, height: 240 })
        .toBuffer({ resolveWithObject: true });
      showImage = sharp(`./tshirts-colors/${tshirtColor}.jpg`)
        .composite([{ input: imageBuffer.data, left: 220, top: 170 }])
        .webp({ quality: 90 })
        .toFile(`./images/${image.filename}.webp`, (err) => {
          if (err) {
            console.log(err);
          }
        });
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).render("admin/editDesign", {
          pageTitle: "Upload Design",
          hasError: true,
          design: {
            title,
            price,
            description,
            published,
            _id: designId,
          },
          errorMessage: errors.array()[0].msg,
          validationError: errors.array(),
        });
      }
      design.title = title;
      design.price = price;
      design.imagePath = showImage.options.fileOut;
      design.originalImagePath = image.path;
      design.description = description;
      design.published = isPublished;
      await design.save();
      res.status(201).redirect("/dashBoard");
    } catch (err) {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    }
  }
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("admin/editDesign", {
      pageTitle: "Upload Design",
      hasError: true,
      design: {
        title,
        price,
        description,
        published,
        _id: designId,
      },
      errorMessage: errors.array()[0].msg,
      validationError: errors.array(),
    });
  }
  try {
    design.title = title;
    design.price = price;
    design.description = description;
    design.published = isPublished;
    await design.save();
    res.status(201).redirect("/dashBoard");
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.deleteDesign = async (req, res, next) => {
  const designId = req.params.designId;
  try {
    const design = await Design.findById(designId);
    deleteFile(design.imagePath);
    await Design.deleteOne({ _id: designId, designerId: req.designer._id });
    res.status(200).json({ message: "Success!" });
  } catch (err) {
    console.log(err);
    res.status(422).json({ message: "Faild to delete design" });
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.getChangePassword = (req, res, next) => {
  const designerId = req.designer._id;
  try {
    res.status(200).render("auth/changePassword", {
      pageTitle: "Change Password",
      designerId: designerId,
      hasError: false,
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.postChangePassword = async (req, res, next) => {
  const { newPassword, designerId } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/changePassword", {
      pageTitle: "Change Password",
      designerId: designerId,
      hasError: true,
      errorMessage: errors.array()[0].msg,
    });
  }
  try {
    const designer = req.designer;
    const currentHashedPassword = await bcrypt.hash(newPassword, 12);
    designer.password = currentHashedPassword;
    await designer.save();
    res.redirect("/dashBoard");
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.getDesignerProfile = async (req, res, next) => {
  try {
    const designer = await Designer.findById(req.designer._id);
    res.status(201).render("admin/profile", {
      pageTitle: "Designer Profile",
      designer,
      hasError: false,
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.postDesignerProfile = async (req, res, next) => {
  const { name, country, city, age, gender, designerId } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("admin/profile", {
      pageTitle: "Designer Profile",
      designer: req.designer,
      hasError: true,
      errorMessage: errors.array()[0].msg,
    });
  }
  try {
    const designer = await Designer.findById(designerId);
    designer.name = name;
    designer.country = country;
    designer.city = city;
    designer.age = age;
    designer.gender = gender;
    await designer.save();
    res.redirect("/dashBoard");
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};
