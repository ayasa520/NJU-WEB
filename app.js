const express = require("express");
const config = require('./config/default')
const cookieParser = require("cookie-parser");
const session = require("express-session");
const app = express();
const apiRouter = require("./routes/api");
const SECRET = require("./config/default").session_secret

app.all("*", function (req, res, next) {
  //设置允许跨域的域名，*代表允许任意域名跨域

  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Origin", config.allow_origin);
  //允许的header类型
  res.header(
    "Access-Control-Allow-Headers",
    "origin, expires, content-type, x-e4m-with, authorization"
  );
  //跨域允许的请求方式
  res.header("Access-Control-Allow-Methods", "DELETE,PUT,POST,GET,OPTIONS");
  if (req.method.toLowerCase() == "options") res.send(200);
  //让options尝试请求快速结束
  else next();
});


app.use(express.json());
app.use(cookieParser(SECRET));

app.use(
  session({
    resave: true,
    secret: SECRET,
    saveUninitialized: true,
  })
);
app.use("/api", apiRouter);

module.exports = app;
