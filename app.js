require("dotenv").config();

require("./config/auth/passport.js"); 

const express = require("express");
const main_router = require("./routes/main");
const path = require("path");
const session = require('express-session');
const passport = require("passport");
const pgSession = require('connect-pg-simple')(session);
const pool = require("./db/pool.js");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true}));
app.use(express.static(path.join(__dirname, "public")));

app.use(express.json()); 
app.use(express.urlencoded({extended: true})); 

app.use(session({
    store: new pgSession({
      pool : pool,                
      tableName : 'Session' 
    }),
    secret: process.env.FOO_COOKIE_SECRET,
    resave: false,
    saveUninitialized: false, 
    cookie: { 
        maxAge: 30 * 24 * 60 * 60 * 1000 
    }
}));  


app.use(passport.initialize());
app.use(passport.session());


app.use("/", main_router);

app.use((err, req, res, next) => {
  res.status(500).render('error_page', { error: err });
});

app.listen(PORT, () => {
  console.log(`App is litening on PORT ${PORT}`);
});
