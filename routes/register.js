const path = require("path");
const express = require("express");
const router = express.Router();

router.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/register.html"));
});

module.exports = router;