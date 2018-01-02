const express = require("express");
const app = express();

app.use(express.static(__dirname + "/static"));
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");

app.get("*", (req, res) => {
  res.render("index");
});

const server = app.listen(8000, () => {
  console.log("Server started on port 8000");
});

require("./services/game.js")(server);