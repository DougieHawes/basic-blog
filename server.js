require("dotenv").config();

const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");

const app = express();

const mongoUri = process.env.MONGODB_URI;
const port = process.env.PORT;

const authRoute = require("./routes/api/auth");

mongoose.connect(
  mongoUri,
  { useNewUrlParser: true, useUnifiedTopology: true },
  console.log("mongo connected")
);

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoute);

app.listen(port, console.log(`express app running on port:${port}`));
