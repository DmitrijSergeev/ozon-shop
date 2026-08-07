import express from "express";

const app = express();

app.get("/", (_, res) => {
  res.send("Backend works!");
});

app.listen(3000, () => {
  console.log("Server started: http://localhost:3000");
});