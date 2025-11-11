const express = require("express");
const { loginUser } = require("../Controller/AuthController");
const router = express.Router();

router.post("/login", loginUser);

module.exports = router;
