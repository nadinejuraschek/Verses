const express = require('express');

const router = express.Router();

const userController = require('./controllers/userController');
const postController = require("./controllers/postController");

router.get("/", userController.home);

// USER RELATED ROUTES
router.post("/register", userController.register);

router.post("/login", userController.login);

router.post("/logout", userController.logout);


// POST RELATED ROUTES
// next() calls the next function listed
router.get("/create-post", userController.mustBeLoggedIn, postController.viewCreateScreen);

module.exports = router;