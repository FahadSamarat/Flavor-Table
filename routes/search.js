const path = require("path");
const express = require("express");
const router = express.Router();

router.get("/search", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "search.html"));

});

module.exports = router;