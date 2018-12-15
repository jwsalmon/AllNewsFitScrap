var express = require("express");
var router = express.Router();
var request = require("request");
var cheerio = require("cheerio");
var mongoose = require("mongoose");
mongoose.Promise = Promise;

var db = require("../models");
//var Article = require("../models/Article.js");

router.get("/", function(req, res) {
  res.render("index");
});

router.get("/save", function(req, res) {
  db.Article.find({}, function(error, doc) {
    if (error) {
      console.log(error);
    }
    else {
      var hbsArticleObject = {
        articles: doc
      };
      res.render("save", hbsArticleObject);
    }
  });
});


// A GET request to scrape the nytimes website
router.post("/scrape", function(req, res) {
  // grabs the body of content with a request
  request("http://www.foxnews.com/", function(error, response, html) {
    // load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(html);
    var scrapedArticles = {};
    $("article h2").each(function(i, element) {
      var result = {};
      result.title = $(this).children("a").text();
      console.log(`Title from results: ${result.title}`);
      result.link = $(this).children("a").attr("href");
      scrapedArticles[i] = result;
    });
    console.log(`Scraped Articles: ${scrapedArticles}`);
    var hbsArticleObject = {
        articles: scrapedArticles
    };
    res.render("index", hbsArticleObject);
  });
});


// posts to the saved route
router.post("/save", function(req, res) {
  console.log('Trying to save Title: ${req.body.title}');
 
  var newArticleObject = {};

  newArticleObject.title = req.body.title;
  newArticleObject.link = req.body.link;
  var entry = new db.Article(newArticleObject);
  console.log(`Save Articles: ${entry}`);
  entry.save(function(err, doc) {
    if (err) {
      console.log(err);
    }
    else {
      console.log(doc);
    }
  });
  res.redirect("/save");
});


// delete by id
router.get("/delete/:id", function(req, res) {
  //console.log("ID is getting read for delete" + req.params.id);
  console.log("Delete function is ready.");
  db.Article.findOneAndRemove({"_id": req.params.id}, function (err, offer) {
    if (err) {
      console.log(`"Unable to delete: ${err}`);
    } else {
      console.log(`"Article(${req.params.id}) Deleted`);
    }
    res.redirect("/save");
  });
});


// delete notes by id
router.get("/notes/:id", function(req, res) {
  //console.log("ID is getting read for delete" + req.params.id);
  console.log("Delete function ready.");
  db.Note.findOneAndRemove({"_id": req.params.id}, function (err, doc) {
    if (err) {
      console.log(`Not able to delete: ${err}`);
    } else {
      console.log(`Deleted Note with id ${req.params.id}`);
    }
    res.send(doc);
  });
});


// grab an article by ObjectId
router.get("/articles/:id", function(req, res) {
  // console.log("ID is getting read" + req.params.id);
  // finds matching id from db
  db.Article.findOne({"_id": req.params.id})
  .populate('notes')
  .exec(function(err, doc) {
    if (err) {
      console.log(`Unable to find article(${req.param.id}) and get its notes.`);
    }
    else {
      console.log(`We are getting article and maybe notes?  ${doc}`);
      res.json(doc);
    }
  });
});


// create or replace existing notes
router.post("/articles/:id", function(req, res) {
  // create new note then pass req.body for the entry
  var newNote = new db.Note(req.body);
  newNote.save(function(error, doc) {
    if (error) {
      console.log(error);
    }
    else {
      db.Article.findOneAndUpdate({ _id: req.params.id }, {$push: {notes: doc._id}}, {new: true, upsert: true})
      .populate('notes')
      .exec(function (err, doc) {
        if (err) {
          console.log(`Cannot find article. (${req.params.id}). 
          error is ${err}`);
        } else {
          console.log(`On note save we are getting notes?  ${doc.notes}`);
          res.send(doc);
        }
      });
    }
  });
});

// Export routes for server.js
module.exports = router;
