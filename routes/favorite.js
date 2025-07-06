const path = require("path");
const express = require("express");
const router = express.Router();

router.get("/favorite", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "favorite.html"));

});

module.exports = router;