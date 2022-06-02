const express = require("express");
const router = express.Router();

const { verifyUser } = require("../authenticate");

const userController = require("../controllers/userController")

router.get("/premium",verifyUser,userController.setPremium)

router.post("/account",verifyUser, userController.updateUser);
router.post("/accountImage",verifyUser,userController.updateUserImage);

router.post("/newPlace",verifyUser, userController.newPlace);

router.get("/getPlaces", userController.getPlaces);
router.get("/getInactivePlaces", userController.getInactivePlaces);

router.get("/getPlace/:id", verifyUser, userController.getPlace)

router.post("/place/:id/newEvent", verifyUser, userController.newEvent)
router.get("/getEvent/:id", verifyUser, userController.getEvent)


router.get("/event/:id/join",verifyUser,userController.joinToEvent)
router.get("/event/:id/leave",verifyUser,userController.leaveFromEvent)

// userController.getPlaces()




module.exports = router;