const url = "http://127.0.0.1:3001";
// 封装一个 ajax
const _ajax = ({ url, method = "GET", data = null, contentType = false }) => {
  return new Promise((resolve, reject) => {
    const req = new XMLHttpRequest();
    req.open(method, url, true);
    req.withCredentials = true;
    req.setRequestHeader("Content-Type", contentType);
    req.setRequestHeader(
      "Authorization",
      "Bearer" + " " + window.localStorage.token
    );
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
const refresh = () => {
  document.getElementById(
    "captcha-img"
  ).src = `${url}/api/verifyCode?${Math.random()}`;
};
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

// const resolved = (res) => {
// const resolved = (res) => {
// };

// const rejected = (res) => {
//   console.log(res);
// };

//  const url = "http://localhost:3001/api";
//  _ajax({
//    url: `${url}/register`,
//    method: "POST",
//    contentType: "application/json",
//    data: `{"username":"rikka", "password":"520"}`,
//  }).then(resolved,rejected);
//
//  _ajax({
//    url: `${url}/login`,
//    method: "post",
//    contentType: "application/json",
//    data: `{"username":"rikka", "password":"521"}`,
//  }).then(resolved,rejected);
