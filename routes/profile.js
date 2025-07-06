const path = require("path");
const express = require("express");
const router = express.Router();

router.get("/profile", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/profile.html"));
});

module.exports = router;