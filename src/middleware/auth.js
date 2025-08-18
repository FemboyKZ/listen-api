const jwt = require("jsonwebtoken");
require("dotenv").config();

const ENV_KEY = process.env.KEY;

const authorize = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) {
    logger.warn(`Unauthorized attempt without key`);
    return res.status(401).send("Access denied. No token provided.");
  }
  try {
    const decoded = jwt.verify(token, ENV_KEY);
    req.user = decoded;
    next();
  } catch (ex) {
    logger.warn(`Unauthorized attempt with key: ${token}`);
    return res.status(401).send("Invalid token.");
  }
};

module.exports = authorize;
