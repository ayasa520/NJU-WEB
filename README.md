# web 第三次作业:登录与注册

使用前后端分离，前端文件位于 front_end 文件夹

配置在 `config/default.js` ，当然可以在具体文件配置，但是这儿方便一点

在线 demo：https://auth.bilibilianime.com/

仓库: https://github.com/ayasa520/NJU-WEB/edit/web_3/

## 部署（启动）

- 预览前端
  - `live-server ./front_end` 

- 只开后端
  - `node ./bin/www` 或者 `npm start`
- 前后端都开
  - `npm run dev`

## 完成点

- [x] 登录

- [x] 注册

- [x] 密码强度前端判定(很弱，装装样子)

- [x] token 保留登录状态

- [x] 图形验证码

- [x] bcrypt 加密存储密码

## 借物表

- express 轻量级 web 框架
- jsonwebtoken 生成 token 
- models MongoDB 的对象模型
- svg-captcha 验证码
- cookie-parser cookie
- express-session session
- bcryptjs 加密
- mongoose 操作 MongoDB

## 大概说明一下

前后端分离, 通过 json 传递信息. 

前端用 `Promise` 包装一下 `XMLHttpRequest`, 用链式调用避免回调地狱

```js 
const _ajax = ({ url, method = "GET", data = null, contentType = false }) => {
  return new Promise((resolve, reject) => {
    const req = new XMLHttpRequest();
    req.open(method, url, true);
    req.withCredentials = true;
    req.setRequestHeader("Content-Type", contentType);
    req.setRequestHeader("Authorization", "Bearer"+" "+ window.localStorage.token);
    req.send(data);
    req.onreadystatechange = () => {
      if (req.readyState === 4) {
        if (req.status === 200) {
          resolve(req.responseText);
        } else {
          reject(req.responseText);
        }
      }
    };
  });
};
```
调用时候就能这样

```js
_ajax({url:xxxxx}).then(res=>{fun(res)},rej=>{fun(rej)}).then...
```

html 上用 form 表单, `onsubmit` 发请求.

```js
const _onsubmit = (route) => {
  const username = String(document.getElementById("username").value);
  const password = String(document.getElementById("password").value);
  const captcha = String(document.getElementById("captcha").value);
  if (username.length === 0) {
    alert("用户名不能为空");
    return false;
  }
  if (password.length === 0) {
    alert("密码不能为空");
    return false;
  }
  _ajax({
    url: `${url}/api/${route}`,
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify({
      username: username,
      password: password,
      captcha: captcha,
    }),
  }).then(
    (resolved) => {
      alert(resolved);
      if (route === "login")
        window.localStorage.token = JSON.parse(resolved).data.token;
      window.location.href = "/";
    },
    (rejected) => {
      alert(rejected);
    }
  );
  return false;
};
```



`server.js` 里写各种 api, 通过 `model.js` 里导出的 User 进行数据增、查操作,
定义了一些中间件来对输入的用户名,密码和,验证码进行检验. 

```js 
app.post("/api/register",[nameValid,pwdValid,captcha],async (req, res) => {
  console.log(req.body)
  // 这一步就写到了数据库
  try {
    const user = await User.create({
      username: req.body.username,
      password: req.body.password,
    });
    res.send({"message":"成功",user:user});
  } catch (e) {
    res.status(422).send(`${req.body.username} 用户名已存在`);
    console.log(e)
  }
});
```

`model.js` 定义了 `User` 对象, 当 `server.js` 中执行 `User.create` 操作时,
密码就会被加盐, 然后哈希, 存入数据库. bcrypt 的盐无需存储. 数据库使用 MongoDB 

```js 
const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true,required: true },
  password: {
    type: String,
    required: true,
    set(val) {
      // 用 bcrypt 散列一下
      return bcryptjs.hashSync(val,bcryptjs.genSaltSync(10));
    },
  },
});
```

用户登录成功后, nodejs 产生一个 token 发送给客户端, 客户端保存在 `localStorage`
中, 当请求某些特定的 api 时候带上这个 token, 以便后端鉴权, 注销就删除这个
token. 我没有做 token 定期失效.

token 加密需要用到 `SECRET`, 最好是做成环境变量, 此处我定义成全局变量

```js 
app.post("/api/login",[nameValid,pwdValid,captcha], async (req, res) => {
  // console.log(req.body);
  const user = await User.findOne({
    username: req.body.username,
  });
  if (!user) {
    return res.status(422).send(`${req.body.username} 用户名不存在`);
  }
  const valid = require("bcryptjs").compareSync(
    req.body.password,
    user.password
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
  res.send({"message":"成功", "data": { user, token: token }});
});
```

验证码使用 `svg-captcha` 生成, 前端有一个 `img` 标签调用验证码 api, 并得到图片,
服务端将验证码文字存入 session 中. 当前端输入的验证码传来, 就和这个 session
中的比较一下.也是一个中间件

```js 
const captcha = async (req, res, next) => {
  const cap = String(req.body.captcha)
  // console.log(req.session)
  req.session.captcha===cap?next():res.status(422).send("验证码不正确")
};
```

需要处理一下跨域问题, 因为生成验证码和验证验证码的 api 不同, 这样
session 可以共享

```js 
app.all("*", function (req, res, next) {
  res.header("Access-Control-Allow-Credentials", "true");
  //设置允许跨域的域名，*代表允许任意域名跨域
  res.header("Access-Control-Allow-Origin", "http://localhost:8080");
  //允许的header类型
  res.header("Access-Control-Allow-Headers", "origin, expires, content-type, x-e4m-with, authorization");
  //跨域允许的请求方式
  res.header("Access-Control-Allow-Methods", "DELETE,PUT,POST,GET,OPTIONS");
  if (req.method.toLowerCase() == "options") res.send(200);
  //让options尝试请求快速结束
  else next();
});
```
