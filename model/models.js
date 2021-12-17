// 定义用户模型
const bcryptjs = require("bcryptjs");
const mongoose = require("mongoose");
const config = require('../config/default')

mongoose.connect(
  config.mongodb.URI
);

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

const User = mongoose.model("User", UserSchema);
// User.db.dropCollection('users')
module.exports = { User }; // 导出用户模型
