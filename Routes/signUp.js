const express = require("express");
const router = express.Router();
const mongodb = require("mongodb");
const bcryptjs = require("bcryptjs");
const uuid = require("uuid");
const crypto = require("crypto");

const db = require("../database/database");
const mailer = require("../mail/mailer");

router.get("/signup", (req, res) => {
  try {
    const emailstatus = req.query.passwordNotMatch;

    res.render("signup", { emailstatus: emailstatus });
  } catch (error) {
    res.status(500).send(`<h1>Server Error</h1><p>${error.message}</p>`);
  }
});

router.post("/signup/doctors", async (req, res) => {
  const { userName, email, slmcregi, role } = req.body;
  
  const missingFields = [];

  if (userName === "") missingFields.push("User Name");
  if (email === "") missingFields.push("Email Address");
  if (slmcregi === "") missingFields.push("SLMC Registration Number");

  if (missingFields.length > 1) {
    return res.json({ success: false, message: "Please fill all Fields" });
  }

  if (missingFields.length === 1) {
    return res.json({
      success: false,
      message: `${missingFields[0]} is required`,
    });
  }

  const [patientEmail, doctorEmail] = await Promise.all([
    db.DbConn().collection("patients").findOne({ email: email }),
    db.DbConn().collection("doctors").findOne({ email: email })
  ]);

  if (patientEmail || doctorEmail) {
    return res.json({ success: false, message: email + " is already used" });
  }

  let userIdURL = uuid.v4();
  const expires = Date.now() + 36000000;
  const emailValidationToken = crypto.randomBytes(32).toString("hex");

  const newUser = {
    name: userName,
    email: email,
    userID: userIdURL,
    password : '',
    slmcregi: slmcregi,
    role: role,
    emailValid : false,
    emailValidationToken : emailValidationToken,
    profileApprove: false,
    linkExpire : expires
  };

try {
    let userURL = `http://localhost:${process.env.PORT}/checkpoint/api?token=${emailValidationToken}`;

    await mailer.emailFuntion.mainEmailValidation(email, userURL);
    console.log("Validation Email sent to " + email);

    const userResult = await db
      .DbConn()
      .collection("doctors")
      .insertOne(newUser);
    res.json({ success: true, message: "We're sent validation link to " + email });
  } catch (error) {
    if (error.message.includes("Error sending email")) {
      console.error("Error sending email:", error);
      res.json({ success: false, message: "Check Your Email Address" });
    } else {
      console.error("Server Error:", error);
      res.json({ success: false, message: "Server Error" });
    }
  }
});

router.post("/signup/patients", async (req, res) => {

  const { userName, email, password, confirmPassword, role } = req.body;

  const missingFields = [];

  if (userName === "") missingFields.push("User Name");
  if (email === "") missingFields.push("Email Address");
  if (password === "") missingFields.push("Password");
  if (confirmPassword === "") missingFields.push("Confirm password");

  if (missingFields.length > 1) {
    return res.json({ success: false, message: "Please fill all Fields" });
  }

  if (missingFields.length === 1) {
    return res.json({
      success: false,
      message: `${missingFields[0]} is required`,
    });
  }

  if (password.length < 6) {
    return res.json({
      success: false,
      message: "Password must be at least 6 characters long",
    });
  }

  if (password !== confirmPassword) {
    return res.json({
      success: false,
      message: "Confirm Password Not Matched",
    });
  }

  const [patientEmail, doctorEmail] = await Promise.all([
    db.DbConn().collection("patients").findOne({ email: email }),
    db.DbConn().collection("doctors").findOne({ email: email })
  ]);

  if (patientEmail || doctorEmail) {
    return res.json({ success: false, message: email + " is already used" });
  }

  const hashedpass = await bcryptjs.hash(password, 12);

  let userIdURL = uuid.v1();
  const expires = Date.now() + 36000000;
  const accountValidationToken = crypto.randomBytes(32).toString("hex");

  const newUser = {
    name: userName,
    email: email,
    userID: userIdURL,
    password: hashedpass,
    accountValidationToken : accountValidationToken,
    profilePicture : `images/0d64989794b1a4c9d89bff571d3d5842.jpg`,
    role: role,
    profileActive: false,
    linkExpire: expires,
  };

  try {
    let userURL = `http://localhost:${process.env.PORT}/checkpoint/api?token=${accountValidationToken}`;

    await mailer.emailFuntion.mainEmail(email, userURL);
    console.log("Activation Email sent to " + email);

    const userResult = await db
      .DbConn()
      .collection("patients")
      .insertOne(newUser);
    res.json({ success: true, message: "Activation Email sent to " + email });

  } catch (error) {

    if (error.message.includes("Error sending email")) {
      console.error("Error sending email:", error);
      res.json({ success: false, message: "Check Your Email Address" });
    } else {
      console.error("Server Error:", error);
      res.json({ success: false, message: "Server Error" });
    }
  }
});

module.exports = router;
