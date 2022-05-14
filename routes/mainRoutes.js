const express = require("express");
const router = express.Router();
const passport = require("passport");

const { verifyUser } = require("../authenticate");

const mainController = require("../controllers/mainController")

router.get("/getUser", verifyUser, mainController.getUserDate);

router.post("/register", mainController.registerUser);

router.post("/login", passport.authenticate("local"), mainController.loginUser);

router.post("/refreshToken", mainController.refreshToken);

router.get("/logout", verifyUser, mainController.logoutUser);

module.exports = router;
