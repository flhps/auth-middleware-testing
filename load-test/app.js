var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var session = require("express-session");
var passport = require("passport");
//var { Strategy } = require("passport-openidconnect");
var { Strategy: OidcStrategy, Issuer, Client } = require("openid-client");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
const { env } = require("process");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "MyVoiceIsMyPassportVerifyMe",
    resave: false,
    saveUninitialized: true,
  }),
);

app.use(passport.initialize());
app.use(passport.session());

// set up passport
Issuer.discover("http://localhost:5004").then((bridgeIssuer) => {
  const client = new bridgeIssuer.Client({
    client_id: env.CLIENT_ID,
    client_secret: "benchmark-secret",
    redirect_uris: ["http://localhost:3000/authorization-code/callback"],
    token_endpoint_auth_method: "client_secret_post",
  });
  passport.use(
    "oidc",
    new OidcStrategy({ client }, (tokenSet, userinfo, done) => {
      // Save user profile or perform other operations
      console.log("LOGIN SUCCESS");
      console.log(tokenSet);
      console.log(userinfo);
      return done(null, { displayName: userinfo.sub });
    }),
  );

  passport.serializeUser((user, next) => {
    next(null, user);
  });

  passport.deserializeUser((obj, next) => {
    next(null, obj);
  });

  function ensureLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }

    res.redirect("/login");
  }

  app.use("/", indexRouter);
  app.use("/users", usersRouter);

  app.use("/login", passport.authenticate("oidc"));

  // not using the passport redirect options and instead adding another handler seems to cause errors
  app.use(
    "/authorization-code/callback",
    passport.authenticate("oidc", {
      failureRedirect: "/error",
      successRedirect: "/profile",
    }),
  );

  app.use("/profile", ensureLoggedIn, (req, res) => {
    res.render("profile", { title: "Express", user: req.user });
  });

  app.get("/logout", (req, res) => {
    req.logout();
    req.session.destroy();
    res.redirect("/");
  });

  // catch 404 and forward to error handler
  app.use(function (req, res, next) {
    next(createError(404));
  });

  // error handler
  app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render("error");
  });
});

module.exports = app;
