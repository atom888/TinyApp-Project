// Lighthouse Labs - W2D2 - TinyApp Project //

var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080

app.set("view engine", "ejs");

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.end("Hello!");
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

app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id,
                      fullURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

//POST requests - body-parser
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

//Request Routing
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.post("/urls", (req, res) => {
  // Long url value
  let longURL = req.body;
  // generate short url
  let shortURL = generateRandomString;
  // add short and long URL values as key value pairs
  urlDatabase[shortURL] = longURL;
  // redirect browser to /urls/short url
  res.render("/urls");
});

// app.get("/u/:shortURL", (req, res) => {
//   let longURL =
//   res.redirect(longURL);
// });



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});




function generateRandomString () {
  return Math.random().toString(36).substring(7);
}