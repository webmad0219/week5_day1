require('dotenv').config();

const bodyParser   = require('body-parser');
const cookieParser = require('cookie-parser');
const express      = require('express');
const favicon      = require('serve-favicon');
const hbs          = require('hbs');
const mongoose     = require('mongoose');
const logger       = require('morgan');
const path         = require('path');
const app          = express();


// Requerimientos PASSPORT
const session       = require("express-session");
const bcrypt        = require("bcrypt");
const passport      = require("passport");
const LocalStrategy = require("passport-local").Strategy;


// Gestión de errores con flach
const flash = require("connect-flash");


// Ojo!: necesitamos el modelo!
const User = require('./models/User')


// Conexión Mongoose
mongoose
  .connect(process.env.DB, {useNewUrlParser: true})
  .then(x => {
    console.log(`Connected to Mongo! Database name: "${x.connections[0].name}"`)
  })
  .catch(err => {
    console.error('Error connecting to mongo', err)
  });



const app_name = require('./package.json').name;
const debug = require('debug')(`${app_name}:${path.basename(__filename).split('.')[0]}`);


// Middleware logger, bodyoparser, cookieparser
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());


// Middleware Sass
app.use(require('node-sass-middleware')({
  src:  path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  sourceMap: true
}));


// Configuración de sesión de usuario
app.use(session({
  secret: "our-passport-local-strategy-app",
  resave: true,
  saveUninitialized: true
}));


// Serialización y des-serialización usuario
passport.serializeUser((user, cb) => cb(null, user._id));
passport.deserializeUser((id, cb) => {
  User.findById(id, (err, user) => {
    if (err) { return cb(err); }
    cb(null, user);
  })
})

// Middleare flash para gestión de errores
app.use(flash());


// Definición de estrategia (usuario y contraseña)
passport.use(new LocalStrategy({ passReqToCallback: true}, (req, username, password, next) => {
  User.findOne({ username }, (err, user) => {
    if (err) { return next(err) }
    if (!user) {
      return next(null, false, { message: "Incorrect username" })
    }
    if (!bcrypt.compareSync(password, user.password)) {
      return next(null, false, { message: "Incorrect password" })
    }
    return next(null, user);
  })
}))


// Middleware inicialización de Passport y de sesión de usuario
app.use(passport.initialize());
app.use(passport.session());
      

// Middlewares de motor de visualizaciones y de directorio PUBLIC
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));



// Título por defecto
app.locals.title = 'Express - Generated with IronGenerator';


// Enrutados base
const authRoutes = require("./routes/auth-routes");
app.use('/', authRoutes);


module.exports = app;
