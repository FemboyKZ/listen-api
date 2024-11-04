require("dotenv").config();

const child = require("child_process");

const express = require("express");
const app = express();
app.use(express.json());

const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

const key = process.env.KEY;
const port = process.env.PORT || 5000;

if (!key) {
  logger.error("Missing key from .env");
  return console.error("Missing key from .env");
}

app.post("/command", (req, res) => {
  logger.info("Command received:" + req.body);
  const command = req.body.command;
  const game = req.body.game;
  const user = req.body.user;

  const authKey = req.headers["authorization"];

  if (authKey !== key) {
    logger.error("Invalid authorization key: " + authKey);
    res.status(401).send({ message: "Unauthorized" });
    return;
  }
  logger.info("Authorization key is valid");

  if (!command || !game || !user) {
    logger.error("Missing command, game, or user");
    res.status(400).send({ message: "Missing command, game, or user" });
    return;
  }

  if (!["start", "stop", "restart", "gameinfo.sh"].includes(command)) {
    logger.error("Invalid command: " + command);
    res.status(400).send({ message: "Invalid command" });
    return;
  }

  if (!["csgo", "cscl", "cs2"].includes(game)) {
    logger.error("Invalid game: " + game);
    res.status(400).send({ message: "Invalid game" });
    return;
  }

  if (!["fkz-1", "fkz-2", "fkz-3", "fkz-4", "fkz-5"].includes(user)) {
    logger.error("Invalid user: " + user);
    res.status(400).send({ message: "Invalid user" });
    return;
  }

  if (command === "gameinfo.sh" && game !== "cs2") {
    logger.error("Invalid game for command: " + game + " - " + command);
    res.status(400).send({ message: "Invalid game for command" });
    return;
  }

  logger.info("Command is Valid, Executing command");

  try {
    if (command === "gameinfo.sh") {
      const result = child.execSync(
        `sudo -iu ${game}-${user} /home/${game}-${user}/${command}`
      );
      if (result) {
        logger.info("Command executed successfully");
        res.status(200).send({ message: "Command executed successfully" });
      } else {
        logger.error("Error occurred while executing command");
        res.status(500).send({ message: "Internal Server Error" });
      }
    }
    // this is hacky, but it works
    if (game === "cscl") {
      const result = child.execSync(
        `sudo -iu ${game}-${user} /home/${game}-${user}/csgoserver ${command}`
      );
      if (result) {
        logger.info("Command executed successfully");
        res.status(200).send({ message: "Command executed successfully" });
      } else {
        logger.error("Error occurred while executing command");
        res.status(500).send({ message: "Internal Server Error" });
      }
    } else {
      const result = child.execSync(
        `sudo -iu ${game}-${user} /home/${game}-${user}/${game}server ${command}`
      );
      if (result) {
        logger.info("Command executed successfully");
        res.status(200).send({ message: "Command executed successfully" });
      } else {
        logger.error("Error occurred while executing command");
        res.status(500).send({ message: "Internal Server Error" });
      }
    }
  } catch (error) {
    logger.error("Error occurred while executing command:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

app.use((err, req, res, next) => {
  logger.error("Error occurred:", err);
  res.status(500).send({ message: "Internal Server Error" });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
