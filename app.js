const path = require("path");
const dotenv = require("dotenv").config({ path: path.join(__dirname, ".env") });
const createError = require("http-errors");
const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const logger = require("./modules/logging")(".");

const indexRouter = require("./routes/index");
const authRouter = require("./routes/auth");
const gameRouter = require("./routes/game");
const setupRouter = require("./routes/setup");
const deckRouter = require("./routes/anonymousDeck");
const roleRouter = require("./routes/roles");
const userRouter = require("./routes/user");
const forumsRouter = require("./routes/forums");
const commentRouter = require("./routes/comment");
const strategyRouter = require("./routes/strategy");
const modRouter = require("./routes/mod");
const chatRouter = require("./routes/chat");
const notifsRouter = require("./routes/notifs");
const shopRouter = require("./routes/shop");
const reportRouter = require("./routes/report");
const siteRouter = require("./routes/site");
const pollRouter = require("./routes/poll");
const vanityUrlRouter = require("./routes/vanityUrl");
const familyRouter = require("./routes/family");
const compression = require("compression");
const cors = require("cors");
const itemsRouter = require("./routes/items");

const session = require("./modules/session");
const csrf = require("./modules/csrf");
const passport = require("passport");

const app = express();

app.use(morgan("combined", { stream: logger.stream }));
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(session);
app.use(passport.initialize());
app.use(passport.session());
app.use(csrf);
app.use(
  compression({
    filter: (req, res) => {
      return req.headers["x-no-compression"]
        ? false
        : compression.filter(req, res);
    },
  })
);
app.use(
  "/uploads",
  express.static(path.join(__dirname, process.env.UPLOAD_PATH), {
    maxAge: 3600,
  })
);

const apiRouter = express.Router();

apiRouter.use("/", indexRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/game", gameRouter);
apiRouter.use("/setup", setupRouter);
apiRouter.use("/deck", deckRouter);
apiRouter.use("/roles", roleRouter);
apiRouter.use("/user", userRouter);
apiRouter.use("/forums", forumsRouter);
apiRouter.use("/comment", commentRouter);
apiRouter.use("/strategy", strategyRouter);
apiRouter.use("/mod", modRouter);
apiRouter.use("/chat", chatRouter);
apiRouter.use("/notifs", notifsRouter);
apiRouter.use("/shop", shopRouter);
apiRouter.use("/report", reportRouter);
apiRouter.use("/site", siteRouter);
apiRouter.use("/poll", pollRouter);
apiRouter.use("/vanityUrl", vanityUrlRouter);
apiRouter.use("/family", familyRouter);
apiRouter.use("/items", itemsRouter);

app.use("/api", apiRouter);

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "react_main/build_public/index.html"));
});

app.all("/*", function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  if (err.status == 404) {
    res.status(404);
    res.send("404");
  } else {
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") == "development" ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.send("Error");
  }
});

module.exports = app;
