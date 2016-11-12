// Lighthouse Labs - W2D2 - TinyApp Project //


// Config //

const express = require("express");
const app = express();
var PORT = process.env.PORT || 8080; // default port 8080
app.set("view engine", "ejs");
//Body-parser
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
//Cookie Parser
const cookieParser = require("cookie-parser");
app.use(cookieParser());

app.use(function(req, res, next) {
  let userCookieInfo = req.cookies["userID"];
  req.currentUser = users[userCookieInfo];
  if (req.currentUser) {
    res.locals.urls = urlDatabase[req.currentUser.id].urls;
    res.locals.username = req.currentUser.email;
  }
next();
});

//////////////////////////

// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com"
// };

const urlDatabase = {
  ajkhsdfjkasd: {
    urls:  [
      {shortURL : "b2xVn2", longURL: "http://www.lighthouselabs.ca"},
      {shortURL : "b33332", longURL: "http://www.example.ca"}
    ],
    userID: "a@a.com"
  },
  ghjgghhjhghjg: {
    urls: [
      {shortURL : "b444442", longURL: "http://www.lighthouselabs.ca"}
    ],
    userID: "email@email.com"
  }
};



const users = require("./user.json");

app.get("/", (req, res) => {
  res.redirect("/register");
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


app.get("/urls/new", (req, res ) => {

  if (!req.currentUser) {
    res.redirect("/login");
  } else {
    res.render("urls_new", {});
  }
});

app.get("/urls/:shortURL", (req, res) => { // Whenever a new URLS is created

  if (!req.currentUser) {
    res.redirect("/login");
  } else {

    let templateVars = {
      shortURL: req.params.shortURL,
      fullURL: res.locals.urls[req.params.id] ///user input is currently undefined

    };
    console.log(res.locals.urls[req.params.id]);
    res.render("urls_show", templateVars);
  }
});

app.get("/urls", (req, res) => {     /// Whenever the url pages loads

  if (!req.currentUser) {
    res.redirect("/login");
  }
  res.render("urls_index", {});
});

app.get("/register", (req, res) => {
  let templateVars = {
    username: req.cookies["userID"] /// review
  };
  res.render("register", templateVars);
})

app.post("/register", (req, res) => {
  let userID = generateRandomUserID();
  let email = req.body.email;
  let password = req.body.password;

  for (var i in users) {
    if (users[i].email === email) {
      res.status(400);
      res.send('Email already taken!');
    }
  }

  users[userID] = {}; //userID is key - needs to be an object
  users[userID].id = userID;
  users[userID].email = email;
  users[userID].password = password;

  res.redirect("/login");
});

app.post("/urls", (req, res) => {
  let longURL = req.body.longURL;
  let fixLongURL = fixURL(longURL);
  let shortURL = generateRandomString();
  urlDatabase[req.currentUser.id].urls[shortURL] = fixLongURL;

  if (!req.currentUser) {
    res.redirect("/login");
  }
  res.redirect(`/urls/${shortURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[req.currentUser.id].urls[shortURL]; /// previous set :urlDatabase[shortURL]
  res.redirect(longURL);
});

app.post("/urls/:id/delete", (req, res) => {
  if (!req.cookies["userID"]) {
    res.redirect("/login");
  }
  let shortURL = req.params.shortURL; // previous set : req.params.id
  delete urlDatabase[req.currentUser.id].urls[shortURL]; // previous set : urlDatabase[shortURL]
  res.redirect("/urls/");
});

app.get("/urls/:id/edit", (req, res) => {

  if (!req.currentUser) {
    res.redirect("/login");
  } else {
    let templateVars = {
      shortURL: req.params.id,
      fullURL: res.locals.urls[req.params.id],
    };
    res.render("urls_show", templateVars);
  }
});

app.post("/urls/:id", (req, res) => {

  // let userCookieInfo = req.cookies["userID"];
  // let currentUser = users[userCookieInfo];

  let shortURL = req.params.id;
  let newLongURL = req.body.longURL;
  let fixLongURL = fixURL(newLongURL);
  urlDatabase[shortURL] = fixLongURL;


  if (!req.currentUser) {
    res.redirect("/login");
  } else {
    let templateVars = {
      shortURL: req.params.id,
      fullURL: res.locals.urls[req.params.id],
    };
    res.render("urls_show", templateVars);
  }
});

/// Cookie Work ///

app.get("/login", (req, res) => {

  // res.render("login", {username: null}); // review

  if (req.cookies["userID"]) {
    res.redirect("/urls");
  } else {
    res.redirect("/register");
  }
});

app.post("/login", (req, res) => {
  let loginEmail = req.body.email;
  let loginPassword = req.body.password;

  for (var i in users) {
    if(users[i].email === loginEmail) {
        if (users[i].password === loginPassword) {
          res.cookie('userID', users[i].id);
          res.redirect("/urls");
          return;
        }
    }
  }
  res.status(403).send("Incorrect email or password. Please register or check your password.");
});

app.post("/logout", (req, res) => {
  res.clearCookie("userID");
  res.redirect("/login");
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});



// Functions //

function fixURL(longURL) {
  if(!longURL.includes("://")) {
    longURL = "https://" + longURL;
  }
  return longURL
};

function generateRandomString () {
  return Math.random().toString(36).substr(2, 6);
}

function generateRandomUserID () {
  return Math.random().toString(36).substr(2, 20);
}