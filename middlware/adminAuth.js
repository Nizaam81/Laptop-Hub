const user = require("../model/usersSchema");

const adminAuth = (req, res, next) => {
  user
    .findOne({ isAdmin: true })
    .then((data) => {
      if (data) {
        next();
      } else {
        res.redirect("/admin/login");
      }
    })
    .catch((error) => {
      console.log("error in Admin Auth middlware!!");
      res.status(500).send("internal server error");
    });
};
const isSessionAdmin = (req, res, next) => {
  if (req.session.admin) {
    next();
  } else {
    res.redirect("/admin/login");
  }
};
module.exports = {
  adminAuth,
  isSessionAdmin,
};
