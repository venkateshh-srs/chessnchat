const express = require("express");
const User = require("../Models/User");
const auth = require("./auth");
const jwt = require("jsonwebtoken");
const router = express.Router();
router.get("/register", (req, res) => {
  res.render("register", { errorMsg: null });
});
router.get("/login", (req, res) => {
  res.render("login", { errorMsg: null });
});
router.post("/register", async (req, res, next) => {
  const { name, password } = req.body;
  //if fields are empty push them in errors array
  let errors = [];
  if (!name || !password) {
    errors.push({ msg: "Fill all feilds" });
  }
  if (errors.length > 0) {
    res.render("register", { errorMsg: null, errors, name, password });
  } else {
    //put in db
    const user = await User.findOne({ name });
    //username already exist
    if (user) res.render("register", { errorMsg: "User already exist" });
    else {
      //register the user in DB
      let newUser = new User({ name, password });
      await newUser.save();
      console.log("registered");
      res.render("login", { errorMsg: null });
    }
  }
});
router.get("/dashboard", (req) => {
  res.render("/dashboard");
});
router.get("/protected", (req, res) => {
  res.send({ msg: "Welcom to protected royute" });
});
router.post("/login", async (req, res, next) => {
  const { name, password } = req.body;
  // console.log(name);
  try {
    const user = await User.findOne({ name });
    if (!user) {
      return res.render("login", {
        errorMsg: "incorrect username or password ",
      });
    }
    if (user.password !== password) {
      return res.render("login", {
        errorMsg: "incorrect username or password ",
      });
    }
    const token = jwt.sign(
      { userId: user._id },
      process.env.ACESS_TOKEN_SECRET,
      {
        expiresIn: "1d",
      }
    );
    res.cookie("jwt", token, { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 });
    console.log("logged in");
    res.render("homepage", { errorMsg: null });
  } catch (err) {
    res.status(404).json({ message: "internal server error" });
  }
  // res.send("h1");
});

module.exports = router;
