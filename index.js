require("dotenv").config();
const child = require("child_process");
const express = require("express");
const winston = require("winston");

const VALID_COMMANDS = new Set(["start", "stop", "restart"]);
const VALID_GAMES = new Set(["csgo", "cscl", "cs2"]);
const VALID_USERS = new Set(["fkz-1", "fkz-2", "fkz-3", "fkz-4", "fkz-5"]);
const CSCL_EXCEPTION = new Set(["cscl"]);

const ENV_KEY = process.env.KEY;
const PORT = process.env.PORT || 5000;

if (!ENV_KEY) {
  console.error("FATAL: Missing KEY in environment");
  process.exit(1);
}

const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

const app = express();
app.use(express.json());

const authorize = (req, res, next) => {
  const authKey = req.headers.authorization;
  if (authKey !== ENV_KEY) {
    logger.warn(`Unauthorized attempt with key: ${authKey}`);
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

const validateRequest = (req, res, next) => {
  const { command, game, user } = req.body;

  const errors = [];
  if (!VALID_COMMANDS.has(command)) errors.push("Invalid command");
  if (!VALID_GAMES.has(game)) errors.push("Invalid game");
  if (!VALID_USERS.has(user)) errors.push("Invalid user");

  if (errors.length > 0) {
    logger.warn(`Invalid request: ${errors.join(", ")}`);
    return res.status(400).json({ errors });
  }

  next();
};

const executeCommand = (command, game, user) => {
  const basePath = `/home/${game}-${user}`;
  let commandString;

  if (command === "gameinfo.sh") {
    commandString = `${basePath}/${command}`;
  } else if (CSCL_EXCEPTION.has(game)) {
    commandString = `${basePath}/csgoserver ${command}`;
  } else {
    commandString = `${basePath}/${game}server ${command}`;
  }

  return child.execSync(`sudo -iu ${game}-${user} ${commandString}`, {
    encoding: "utf-8",
    stdio: "pipe",
  });
};

app.post("/command", authorize, validateRequest, (req, res) => {
  const { command, game, user } = req.body;

  logger.info("Executing command", { command, game, user });

  try {
    const result = executeCommand(command, game, user);
    logger.info("Command executed successfully", { command, game, user });
    res.json({
      status: "success",
      command: `${game}-${user}: ${command}`,
      output: result.trim(),
    });
  } catch (error) {
    logger.error("Command execution failed", {
      error: error.message,
      stderr: error.stderr?.trim(),
      stdout: error.stdout?.trim(),
    });
    res.status(500).json({
      error: "Command execution failed",
      details: error.stderr?.trim() || error.message,
    });
  }
});

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
