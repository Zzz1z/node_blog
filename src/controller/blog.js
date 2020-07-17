const { exec } = require("../db/mysql");
//获取所有博客列表数据
const getList = (author, keyword) => {
  let sql = `select * from blog where 1=1 `;
  if (author) {
    sql += `and author ='${author}' `;
  }
  if (keyword) {
    sql += `and title like '%${keyword}%' `;
  }
  sql += "order by createtime desc";
  return exec(sql);
};
//获取博客详情
const getDetail = (id) => {
  let sql = `select * from blog where id='${id}' order by createtime desc`;
  return exec(sql);
};
//新增博客
const newBlog = (blogData = {}) => {
  // console.log(blogData);
  const { title, content, author } = blogData;
  const createtime = Date.now();
  let sql = `insert into blog (title,content,createtime,author) values ('${title}','${content}','${createtime}','${author}')`;
  return exec(sql).then((insertData) => {
    return {
      id: insertData.insertId,
    };
  });
};
//更新博客
const updateBlog = (id, blogData = {}) => {
  const { title, content } = blogData;
  const sql = ` update blog set title='${title}',content='${content}' where id='${id}' `;
  return exec(sql).then((updateData) => {
    return updateData.affectedRows > 0 ? true : false;
  });
};
const deleteBlog = (id, author) => {
  const sql = `delete from blog where id='${id}' and author='${author}'`;
  return exec(sql).then((deleteData) => {
    return deleteData.affectedRows > 0 ? true : false;
  });
};
// const
module.exports = {
  getList,
  getDetail,
  newBlog,
  updateBlog,
  deleteBlog,
};
