const jwt = require("jsonwebtoken");
function authenticateJWT(req, res, next) {
  const token = req.cookies.jwt;

  if (!token) {
    return res.redirect("/users/register");
  }

  jwt.verify(token, process.env.ACESS_TOKEN_SECRET, (err) => {
    if (err) {
      return res.status(403).json({ message: "Token is not valid" });
    }
  });
  next();
}

module.exports = authenticateJWT;
