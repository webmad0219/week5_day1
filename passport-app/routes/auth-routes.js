const express     = require("express");
const authRoutes  = express.Router();
const passport    = require("passport");
const bcrypt      = require("bcrypt");
const bcryptSalt  = 10;

// gestión de login
const ensureLogin = require("connect-ensure-login");

const User = require("../models/User");




//Ruta index
authRoutes.get('/', (req, res, next) => res.render('index'));


// Rutas de signup
authRoutes.get("/signup", (req, res) => res.render("auth/signup"))
authRoutes.post("/signup", (req, res, next) => {
  const username = req.body.username;
  const password = req.body.password;

  if (username === "" || password === "") {
    res.render("auth/signup", { message: "Indicate username and password" });
    return
  }

  User.findOne({ username })
  .then(user => {
    if (user !== null) {
      res.render("auth/signup", { message: "The username already exists" });
      return
    }

    const salt = bcrypt.genSaltSync(bcryptSalt);
    const hashPass = bcrypt.hashSync(password, salt);

    const newUser = new User({username, password: hashPass})

    newUser.save(err => {
      if (err) {
        res.render("auth/signup", { message: "Something went wrong" });
      } else {
        res.redirect("/")
      }
    })
  })
  .catch(error => {
    next(error)
  })
});




// Ruta de randerizado de formulario login (con gestión de errores flash)
authRoutes.get("/login", (req, res, next) => {
    res.render("auth/login", { "message": req.flash("error") });
})

// Ruta de gestión de datos de formulario login con Passport
authRoutes.post("/login", passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
    passReqToCallback: true
}))

// Logout
authRoutes.get("/logout", (req, res) => {
    req.logout()
    res.redirect("/login")
});


// Ruta restringida de página privada (sólo con sesión iniciada yay)
authRoutes.get("/private-page", ensureLogin.ensureLoggedIn(), (req, res) => res.render("private", { user: req.user }));


module.exports = authRoutes;