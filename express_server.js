// Lighthouse Labs - W2D2 - TinyApp Project //


// Config //

const express = require("express");
const app = express();
var PORT = process.env.PORT || 8080; // default port 8080
app.set("view engine", "ejs");
// Body-parser
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
//Cookie Parser
const cookieParser = require("cookie-parser");
app.use(cookieParser());




var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {

  res.redirect("/urls");
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


app.get("/urls/new", (req, res ) => {
  if (!req.cookies["username"]) {
    res.redirect("/login");
  }
  res.render("urls_new", {
    username: req.cookies["username"]
  });
});

app.get("/urls/:id", (req, res) => {
  if (!req.cookies["username"]) {
    res.redirect("/login");
  }
  let templateVars = {
    shortURL: req.params.id,
    fullURL: urlDatabase[req.params.id],
    username: req.cookies["username"]
  };

  res.render("urls_show", templateVars);
});

app.get("/urls", (req, res) => {
  if (!req.cookies["username"]) {
    res.redirect("/login");
  }
  let templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"]
  };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  if (!req.cookies["username"]) {
    res.redirect("/login");
  }
  let longURL = req.body.longURL;
  let fixLongURL = fixURL(longURL);
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = fixLongURL;
  res.redirect(`/urls/${shortURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL];
  res.redirect(longURL);
});

app.post("/urls/:id/delete", (req, res) => {
  if (!req.cookies["username"]) {
    res.redirect("/login");
  }
  let shortURL = req.params.id;
  delete urlDatabase[shortURL];
  res.redirect("/urls/");
});

app.get("/urls/:id/edit", (req, res) => {
  if (!req.cookies["username"]) {
    res.redirect("/login");
  }
  res.redirect("/urls_show");
});

app.post("/urls/:id", (req, res) => {
  if (!req.cookies["username"]) {
    res.redirect("/login");
  }
  let shortURL = req.params.id;
  let newLongURL = req.body.longURL;
  let fixLongURL = fixURL(newLongURL);
  urlDatabase[shortURL] = fixLongURL;
  res.redirect(`/urls/${shortURL}`);
});

/// Cookie Work ///

app.get("/login", (req, res) => {
  res.render("login", {
    username: req.cookies["username"]
  });
});

app.post("/login", (req, res) => {
  let username = req.body.username;
  res.cookie('username', username);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/login");
})


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function fixURL(longURL) {
  if(!longURL.includes("://")) {
    longURL = "https://" + longURL;
  }
  return longURL
};

function generateRandomString () {
  return Math.random().toString(36).substr(2, 6);
}