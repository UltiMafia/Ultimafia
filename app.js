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
const roleRouter = require("./routes/roles");
const userRouter = require("./routes/user");
const forumsRouter = require("./routes/forums");
const commentRouter = require("./routes/comment");
const modRouter = require("./routes/mod");
const chatRouter = require("./routes/chat");
const notifsRouter = require("./routes/notifs");
const shopRouter = require("./routes/shop");
const feedbackRouter = require("./routes/feedback")

const session = require("./modules/session");
const csrf = require("./modules/csrf");

const app = express();

app.use(morgan("combined", { stream: logger.stream }));
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session);
app.use(csrf);
app.use("/uploads", express.static(path.join(__dirname, process.env.UPLOAD_PATH), { maxAge: 3600 }));
app.use(express.static(path.join(__dirname, "react_main/build_public"), { maxAge: 3600 }));

app.use("/", indexRouter);
app.use("/auth", authRouter);
app.use("/game", gameRouter);
app.use("/setup", setupRouter);
app.use("/roles", roleRouter);
app.use("/user", userRouter);
app.use("/forums", forumsRouter);
app.use("/comment", commentRouter);
app.use("/mod", modRouter);
app.use("/chat", chatRouter);
app.use("/notifs", notifsRouter);
app.use("/shop", shopRouter);
app.use("/feedback", feedbackRouter)

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "react_main/build_public/index.html"));
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
    }
    else {
        res.locals.message = err.message;
        res.locals.error = req.app.get("env") == "development" ? err : {};

        // render the error page
        res.status(err.status || 500);
        res.send("Error");
    }
});

module.exports = app;
