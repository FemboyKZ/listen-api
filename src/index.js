import dotenv from "../dotenv";
dotenv.config();

const express = require("express");
const app = express();
app.use(express.json());

const key = process.env.KEY;
const port = process.env.PORT || 5000;

if (!key) {
  return console.error("Missing key");
}

app.post("/command", (req, res) => {
  const auth = req.headers["authorization"];
  if (auth !== key) {
    return res.status(401).send("Unauthorized");
  }

  const { command } = req.body;
  console.log(`Received command: ${command}`);

  // TODO: The actual CMDs

  res.status(200).send(`Command received: ${command}`);
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
