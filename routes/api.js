const express = require("express");
const router = express.Router();
const svgCaptcha = require("svg-captcha");
const { User } = require("../model/models");
const jwt = require("jsonwebtoken");
const SECRET = require('../config/default').jwt_secret;
const auth = async (req, res, next) => {
  try {
    const raw = String(req.headers.authorization).split(" ").pop();
    const { id } = jwt.verify(raw, SECRET);
    req.user = await User.findById(id);
    next();
  } catch (e) {
    res.status(401).send("未登录");
  }
};

const captcha = async (req, res, next) => {
  const cap = String(req.body.captcha);
  console.log(req.session.captcha);
  req.session.captcha === cap ? next() : res.status(422).send("验证码不正确");
};

const nameValid = async (req, res, next) => {
  String(req.body.username).length != 0
    ? next()
    : res.status(422).send("用户名不能为空");
};

const pwdValid = async (req, res, next) => {
  const l = String(req.body.password).length;
  l >= 6 && l <= 16 ? next() : res.status(422).send("请输入正确密码");
};

router.get("/verifyCode", (req, res) => {
  // 创建验证码
  const captchaCode = svgCaptcha.create({
    color: true, // 彩色
    //inverse:false,// 反转颜色
    width: 100, //  宽度
    height: 40, // 高度
    fontSize: 48, // 字体大小
    size: 4, // 验证码的长度
    noise: 3, // 干扰线条
    ignoreChars: "0oO1ilI", // 验证码字符中排除 0o1i
  });
  // console.log(captcha.data); svg 直接输出到页面
  // session里面也放一份
  req.session.captcha = captchaCode.text;
  // cookie放一份
  res.cookie("captcha", req.session);
  console.log(req.session.captcha)
  res.type("svg");
  res.status(200).send(captchaCode.data);
  // 往session，cookie中都存入一个验证码，并且把验证码显示在页面上
});
/* GET users listing. */
router.get("/profile", auth, async (req, res) => {
  res.send(req.user);
});
router.post("/register", [nameValid, pwdValid, captcha], async (req, res) => {
  console.log(req.body);
  // 这一步就写到了数据库

  try {
    const user = await User.create({
      username: req.body.username,
      password: req.body.password,
    });
    res.send({ message: "成功", user: user });
  } catch (e) {
    res.status(422).send(`${req.body.username} 用户名已存在`);
    console.log(e);
  }
});

router.post("/login", [nameValid, pwdValid, captcha], async (req, res) => {
  console.log(req.body);
  const user = await User.findOne({
    username: req.body.username,
  });
  if (!user) {
    return res.status(422).send(`${req.body.username} 用户名不存在`);
  }
  const valid = require("bcryptjs").compareSync(
    req.body.password,
    String(user.password)
  );

  if (!valid) {
    return res.status(422).send("密码错误");
  }
  const token = jwt.sign(
    {
      id: String(user._id),
    },
    SECRET
  );
  res.send({ message: "成功", data: { user, token: token } });
});

module.exports = router;
