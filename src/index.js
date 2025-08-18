require("dotenv").config();
const express = require("express");
const logger = require("./logger");

const ENV_KEY = process.env.KEY;
const PORT = process.env.PORT || 5000;

if (!ENV_KEY) {
  console.error("FATAL: Missing KEY in environment");
  process.exit(1);
}

const app = express();
app.use(express.json());
const commandController = require("./commands/bot-commands.js");
app.use("/api", commandController);

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
