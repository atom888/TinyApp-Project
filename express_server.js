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
  // res.end("Hello!");
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

app.get("/urls/new", (req, res) => { //new url
  res.render("urls_new");
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

app.post("/urls", (req, res) => {

  function fixURL(brokenURL) {
    if(longURL.startsWith("www.")) {
      longURL = "https://" + longURL;
      return longURL;
    }
    if (longURL.startsWith("http://")) {
      return longURL;
    }
    if (longURL.startsWith("https://")) {
      return longURL;
    } else {
      longURL = "https://wwww." + longURL;
      return longURL;
    }
  };

  // Long url value
  let longURL = req.body.longURL;
  // generate short url
  let shortURL = generateRandomString();
  // add short and long URL values as key value pairs
  urlDatabase[shortURL] = fixURL(longURL);
  // redirect browser to /urls pair list
  res.redirect(`/urls/${shortURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL];
  res.redirect(longURL);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});




function generateRandomString () {
  return Math.random().toString(36).substr(2, 6);
}