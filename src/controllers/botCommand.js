const child = require("child_process");
const express = require("express");
const router = express.Router();
router.use(express.json());

const VALID_COMMANDS = new Set(["start", "stop", "restart"]);
const VALID_GAMES = new Set(["csgo", "cscl", "cs2"]);
const VALID_USERS = new Set(["fkz-1", "fkz-2", "fkz-3", "fkz-4", "fkz-5"]);
const CSCL_EXCEPTION = new Set(["cscl"]);

const logger = require("../logger");
const authorize = require("../middleware/auth");

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

router.post("/command", authorize, validateRequest, (req, res) => {
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

module.exports = router;
