const { exec, escape } = require("../db/mysql");
const { genPassword } = require("../utils/cryp");
const login = (username, password) => {
  //加密
  password = genPassword(password);
  //防止sql注入攻击
  username = escape(username);
  //防止sql注入攻击
  password = escape(password);
  let sql = `
  select username,realname from users where username=${username} and password=${password}
  `;
  return exec(sql).then((row) => {
    return row[0] || {};
  });
};
module.exports = {
  login,
};
