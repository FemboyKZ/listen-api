require("dotenv").config();

const express = require("express");
const app = express();
app.use(express.json());

const key = process.env.KEY;
const port = process.env.PORT || 5000;

app.post("/command", (req, res) => {
  const { command } = req.body;
  console.log(`Received command: ${command}`);

  // TODO: The actual CMDs

  res.status(200).send(`Command received: ${command}`);
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
