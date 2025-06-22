require("dotenv").config();

const express = require("express");

var cors = require("cors");

const app = express();

app.use(cors());

app.use(express.static("public"));

const axios = require("axios");

const recipeshandle = require("./routes/recipes");
app.use("/", recipeshandle);

const homepage = require("./routes/home");
app.use("/", homepage);

const searchpage = require("./routes/search");
app.use("/", searchpage);

const randomhpage = require("./routes/random");
app.use("/", randomhpage);

const favoritepage = require("./routes/favorite");
app.use("/", favoritepage);

// 404 handler
app.use((req, res) => {
  res.status(404).send("Page not found <a href='/'>Get back home</a>");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`app listening on port http://localhost:${port}`);
});