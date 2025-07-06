const path = require("path");
const express = require("express");
const router = express.Router();

router.get("/random", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "RandomRecipes.html"));

});

module.exports = router;