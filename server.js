require("dotenv").config();



const express = require("express");
const app = express();

var cors = require("cors");
app.use(cors());

app.use(express.static("public"));

const axios = require("axios");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const pg = require("pg");
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// Routing
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
// app.listen(port, () => {
//   console.log(`app listening on port http://localhost:${port}`);
// });

pool
  .connect()
  .then((client) => {
    return client
      .query("SELECT current_database(), current_user")
      .then((res) => {
        client.release();

        const dbName = res.rows[0].current_database;
        const dbUser = res.rows[0].current_user;

        console.log(
          `Connected to PostgreSQL as user '${dbUser}' on database '${dbName}'`
        );

        console.log(`App listening on port http://localhost:${port}`);
      });
  })
  .then(() => {
    app.listen(port);
  })
  .catch((err) => {
    console.error("Could not connect to database:", err);
  });