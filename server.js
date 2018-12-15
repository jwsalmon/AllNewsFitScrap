// Dependencies
var express = require('express');
var logger = require('morgan');
var mongoose = require('mongoose');

var db = require('./models');


var request = require('request');
var cheerio = require('cheerio');
mongoose.Promise = Promise;

var PORT = process.env.PORT || 3000;

var app = express();

app.use(logger("dev"));
app.use(express.urlencoded({
  extended: true
}));
app.use(express.json());

app.use(express.static("public"));
var exphbs = require('express-handlebars');
app.engine('handlebars', exphbs({defaultLayout: "main"}));
app.set('view engine', 'handlebars');

var routes = require("./controllers/controller.js");
app.use("/", routes);
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect(MONGODB_URI);

db = mongoose.connection;

db.on("error", function(error) {
  console.log(`Mongoose Error: ${error}`);
});

db.once("open", function() {
  console.log("Mongoose connection successful.");
});

app.listen(PORT, function() {
  console.log(`App running on PORT ${PORT}`);
});
