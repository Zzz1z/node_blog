const queryString = require("querystring");
const { get, set } = require("./src/db/redis");
const { access } = require("./src/utils/log");
const handleBlogRouter = require("./src/router/blog");
const handleUserRouter = require("./src/router/user");
//session数据
// const SESSION_DATA = {};
//处理post data 数据
const getPostData = (req) => {
  const promise = new Promise((resolve, reject) => {
    if (req.method !== "POST") {
      resolve({});
      return;
    }
    if (req.headers["content-type"] !== "application/json") {
      resolve({});
      return;
    }
    let postData = "";
    req.on("data", (chunk) => {
      postData += chunk.toString();
    });
    req.on("end", () => {
      if (!postData) {
        resolve({});
        return;
      }
      resolve(JSON.parse(postData));
    });
  });
  return promise;
};

//获取cookie过期时间
const getCookieExpires = () => {
  let d = new Date();
  d.setTime(d.getTime() + 24 * 60 * 60 * 1000);
  return d.toGMTString();
};

const serveHandle = (req, res) => {
  access(
    `${req.method} -- ${req.url} -- ${
      req.headers["user-agent"]
    } -- ${Date.now()}`
  );
  //设置返回的数据格式
  res.setHeader("Content-type", "application/json");
  const url = req.url;
  req.path = url.split("?")[0];
  //处理传过来的参数
  req.query = queryString.parse(url.split("?")[1]);

  req.cookie = {};
  //解析Cookie
  const cookieStr = req.headers.cookie || "";
  cookieStr.split(";").forEach((item) => {
    if (!item) {
      return;
    }
    const arr = item.split("=");
    const key = arr[0].trim();
    const val = arr[1];
    req.cookie[key] = val;
  });

  // 解析session
  // let needSetCookie = false;
  // let userId = req.cookie.userid;
  // if (userId) {
  //   if (!SESSION_DATA[req.cookie]) {
  //     SESSION_DATA[userId] = {};
  //   }
  // } else {
  //   needSetCookie = true
  //   userId = `${Date.now()}_${Math.random()}`;
  //   SESSION_DATA[userId] = {};
  // }
  // req.session = SESSION_DATA[userId];

  //解析session（redis）
  let needSetCookie = false;
  let userId = req.cookie.userid;
  if (!userId) {
    needSetCookie = true;
    userId = `${Date.now()}_${Math.random()}`;
    set(userId, {});
  }
  //获取session
  req.sessionId = userId;
  get(req.sessionId)
    .then((sessionData) => {
      //如果通过req.sessionId拿不到值
      if (sessionData == null) {
        //设置redis里面的 session 值
        set(req.sessionId, {});
        //初始化session
        req.session = {};
      } else {
        //通过req.session 拿到值，复制给session
        req.session = sessionData;
      }
      return getPostData(req);
    })
    //处理post data 的数据
    .then((postData) => {
      req.body = postData;
      //处理博客路由
      const blogResult = handleBlogRouter(req, res);
      if (blogResult) {
        blogResult.then((blogData) => {
          if (needSetCookie) {
            res.setHeader(
              "Set-Cookie",
              `userid=${userId}; path=/; httpOnly; expires=${getCookieExpires()}`
            );
          }
          res.end(JSON.stringify(blogData));
        });
        return;
      }
      // const blogData = handleBlogRouter(req, res);
      // if (blogData) {
      //   res.end(JSON.stringify(blogData));
      //   return;
      // }

      //处理用户路由
      // const userData = handleUserRouter(req, res);
      // if (userData) {
      //   res.end(JSON.stringify(userData));
      //   return;
      // }
      const userResult = handleUserRouter(req, res);
      if (userResult) {
        userResult.then((userData) => {
          if (needSetCookie) {
            res.setHeader(
              "Set-Cookie",
              `userid=${userId}; path=/; httpOnly; expires=${getCookieExpires()}`
            );
          }
          res.end(JSON.stringify(userData));
        });
        return;
      }

      //找不到路由返回404
      res.writeHeader(404, { "Content-type": "text/plain" });
      res.write("404 Not Found\n");
      res.end();
    });
};

module.exports = serveHandle;
