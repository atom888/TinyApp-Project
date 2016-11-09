// Lighthouse Labs - W2D2 - TinyApp Project //


// Config //

var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
app.set("view engine", "ejs");
// Body-parser
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));



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

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id,
                      fullURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
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
  let shortURL = req.params.id;
  delete urlDatabase[shortURL];
  res.redirect("/urls/");
});

app.get("/urls/:id/edit", (req, res) => {
  res.redirect("/urls_show");
});

app.post("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  let newLongURL = req.body.longURL;
  let fixLongURL = fixURL(newLongURL);
  urlDatabase[shortURL] = fixLongURL;
  res.redirect(`/urls/${shortURL}`);
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