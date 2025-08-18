import express from "express";
import dotenv from "dotenv";
dotenv.config();
import logger from "./logger.js";

const ENV_KEY = process.env.KEY;
const PORT = process.env.PORT || 5000;

if (!ENV_KEY) {
  console.error("FATAL: Missing KEY in environment");
  process.exit(1);
}

import "./db.js";

const app = express();
app.use(express.json());

import commands from "./controllers/botcommand.js";
app.use("/api", commands);

app.use((err, req, res, next) => {
  logger.error("Unexpected error", {
    error: err.message,
    stack: err.stack,
  });
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}`);
});
