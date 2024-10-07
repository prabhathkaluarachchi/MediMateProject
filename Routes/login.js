const express = require("express");
const bcryptjs = require("bcryptjs");
const crypto = require("crypto");
const router = express.Router();

const db = require("../database/database");

router.get("/login", (req, res) => {
  try {
    const { token } = req.query;

    if (token && token === req.session.invalidLinkToken) {
      req.session.invalidLinkToken = null;
      res.render("login", {
        validation: true,
        successfullValidation: false,
        validationMsg: "Invalid Validation Link.",
      });

    }  else if (token && token === req.session.alreadyEmailValidate) {
      req.session.alreadyEmailValidate = null;
      res.render("login", {
        validation: true,
        successfullValidation: false,
        validationMsg: "Email Address is Already Validated",
      });

    } else if (token && token === req.session.successEmailValidation) {
      req.session.successEmailValidation = null;
      res.render("login", {
        validation: false,
        successfullValidation: true,
        validationMsg1: "Email Successfully Validated",
        validationMsg2: "Your Account is under approving process. We'll let to know after process is done",
      });
      
    } else if (token && token === req.session.alreadyActivated) {
      req.session.alreadyActivated = null;
      res.render("login", {
        validation: true,
        successfullValidation: false,
        validationMsg: "Your Accout already Actived, Please Login",
      });

    } else if (token && token === req.session.notExitsUser) {
      req.session.notExitsUser = null;
      res.render("login", {
        validation: true,
        successfullValidation: false,
        validationMsg: "Cannot Find User.",
      });

    } else if (token && token === req.session.incorrectPassword) {
      req.session.incorrectPassword = null;
      res.render("login", {
        validation: true,
        successfullValidation: false,
        validationMsg: "Incorrect Password.",
      });

    } else if (token && token === req.session.profileActive) {
      req.session.profileActive = null;
      res.render("login", {
        validation: true,
        successfullValidation: false,
        validationMsg: "Your Accout is not Actived.",
      });

    } else {
      res.render("login", { validation: false, successfullValidation: false });
    }
  } catch (error) {
    res.status(500).send(`<h1>Server Error</h1><p>${error.message}</p>`);
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const [patientAccount, doctorAccount] = await Promise.all([
      db.DbConn().collection("patients").findOne({ email: email }),
      db.DbConn().collection("doctors").findOne({ email: email }),
    ]);

    if (!patientAccount && !doctorAccount) {
      const notExitsUser = crypto.randomBytes(32).toString("hex");
      req.session.notExitsUser = notExitsUser;
      return res.redirect(`/login?token=${notExitsUser}`);
    }

    if(patientAccount){
      
      const passEqual = await bcryptjs.compare(password, patientAccount.password);
      if (!passEqual) {
        const incorrectPassword = crypto.randomBytes(32).toString("hex");
        req.session.incorrectPassword = incorrectPassword;
        return res.redirect(`/login?token=${incorrectPassword}`);
      }

      if (!patientAccount.profileActive) {
        const profileActive = crypto.randomBytes(32).toString("hex");
        req.session.profileActive = profileActive;
        return res.redirect(`/login?token=${profileActive}`);
      }

      return res.redirect(`/patient/${patientAccount.userID}`);

    }


    if(doctorAccount){

      const passEqual = await bcryptjs.compare(password, doctorAccount.password);
      if (!passEqual) {
        const incorrectPassword = crypto.randomBytes(32).toString("hex");
        req.session.incorrectPassword = incorrectPassword;
        return res.redirect(`/login?token=${incorrectPassword}`);
      }

      return res.redirect(`/doctor/${doctorAccount.userID}`);

    }

  } catch (error) {

    res.status(500).send(`<h1>Server Error</h1><p>${error.message}</p>`);
  }
});

module.exports = router;
