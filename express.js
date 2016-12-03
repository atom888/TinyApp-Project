//Version 2 //
const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
const bcrypt = require('bcrypt');
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
const session = require("express-session");
const cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");
app.use(cookieSession ({
  name: 'session',
  keys: ["kittyboots", "secretkey"],
  maxAge: 24 * 60 * 60 * 1000
}));

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}))

app.use(cookieParser())

app.set("trust proxy", 1);
app.set("view engine", "ejs");

// Middleware //

app.use(function (req, res, next) {

  let userIdSession = req.session.userID;
  req.currentUser = usersDatabase[userIdSession];
  res.locals.currentUser = usersDatabase[userIdSession];

  if (req.currentUser) {
    res.locals.urls = urlsDatabase[userIdSession];
    res.locals.username = req.currentUser.email;
  }
  next();
});


// Databases //

const usersDatabase = {
  "af7656" : {
    "id": "af7656",
    "email": "a@a.com",
    "password": bcrypt.hashSync("p", bcrypt.genSaltSync(10))
  }
};

const urlsDatabase = {
  "af7656" : {
    "9sm5xK": "http://www.google.com",
    "444444": "http://www.lighthouselabs.com"
  }
};

///////////////    Routes     ///////////////

app.get("/urls.json", (req, res) => {
  res.json(urlsDatabase);
});

app.get("/", function(req, res) {
  res.redirect("/login");
});

app.get("/urls", function(req, res) { // working
  const currentUser = req.session.userID;
  if (!req.currentUser) {
    res.status(401);
    res.redirect("/login");
  } else {
  var currentUserURLs = {};
  for (var userID in urlsDatabase) {
    if (userID === req.currentUser.id) {
      currentUserURLs = urlsDatabase[userID];
     }
  }
  let templateVars = {
    urls: currentUserURLs,
    email: req.currentUser.email
  };
  res.status(200);
  res.render("urls_index", templateVars);
  }
});

app.get("/urls/new", function(req, res) {
  if (req.currentUser === undefined) {
    res.status(401);
    res.render("login") // render page with link to login?
  } else {
    res.status(200);
    res.render("urls_new", {
      email: req.currentUser.email
    });
  }
});

app.get("/urls/:shortURL", function(req, res) { // working
  if (req.currentUser.id !== req.session.userID) {
    res.status(403); // render a 403 page?
    res.redirect("/urls");
  } else {
    res.status(200);
    let shortURL = req.params.shortURL;
    let fullURL = urlsDatabase[req.currentUser.id][req.params.shortURL];

    let templateVars = {
      shortURL: shortURL,
      fullURL: fullURL,
      username: req.session.userID,
      email: req.currentUser.email
    };
    res.render("urls_show", templateVars)
  }
});

app.get("/u/:id", function(req, res) { // working
    if (req.params.id === undefined) {
      res.status(404);
      return;
    } else {
      res.redirect(urlsDatabase[req.currentUser.id][req.params.id]);
    }
});

app.post("/urls", function(req, res) {
  let longURL = fixURL(req.body.longURL);
  let shortURL = generateRandomString();
  urlsDatabase[req.currentUser.id][shortURL] = longURL;

  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:id", function(req, res) { // FIXED
  if (!req.currentUser) {
    res.status(401);
    res.redirect("/login");
  }
  if (urlsDatabase[req.currentUser.id]) {
    let updatedURL = req.body.longURL;
    urlsDatabase[req.currentUser.id][req.params.id] = fixURL(updatedURL);
    res.redirect(`/urls/${req.params.id}`);
  } else {
    res.status(403);
    res.redirect("/urls");
  }
});

app.get("/login", function(req, res) {

  if (req.currentUser) {
    res.redirect("/urls");
  } else {
    res.status(200);
    res.render("login");
  }
});

app.get("/register", function(req, res) {


  if (req.currentUser) {
    res.redirect("/urls");
  } else {
    let templateVars = {
      email: req.session.userID
    };
    res.render("register", templateVars);
  }
});

app.post("/register", function(req, res) { //working
  if ((req.body.email === "") || (req.body.password === "")) {
    res.status(400);
    res.send("Not a valid password or email!");
  } else {
    for (let i in usersDatabase) {
      if (req.body.email === usersDatabase[i].email) {
        res.status(400);
        res.send("Email already exist!");
        return;
      }
    }

    let userID = generateRandomUserID();
    urlsDatabase[userID] = {};
    usersDatabase[userID] = {};
    usersDatabase[userID].id = userID;
    usersDatabase[userID].email = req.body.email;
    usersDatabase[userID].password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10));
    res.redirect("/login");
  }
});

app.post("/login", function(req, res) { //working

  let loginEmail = req.body.email;
  let loginPassword = req.body.password;

  let user = null;
  for (let userId in usersDatabase) {
    let userCandidate = usersDatabase[userId];
    console.log("UserDB: " + userCandidate.email);
    if (userCandidate.email === loginEmail) {
      user = userCandidate;
    }
  }

  if (user === null) {
    res.status(403).send("Incorrect email or password. Please register or check your password");
  } else {
    bcrypt.compare(loginPassword, user.password, function (err, passwordMatches) {
      if (err) {
        console.log("TEST777 " + err);
        res.redirect("/login");
      } else if (!passwordMatches) {
        res.status(403).send("Incorrect email or password. Please register.");
      } else {
        console.log("TEST88");
        req.session.userID = user.id;
        res.redirect("/urls");
      }
    });
  }
});

app.post("/logout", function(req, res) { //working
  req.session = null;
  res.clearCookie("userID");
  res.redirect("/login");
});

app.post("/urls/:id/delete", function(req, res) { //working
  for (let key in usersDatabase) {
    if (usersDatabase[key].id !== req.currentUser.id) {
      res.status(403);
      res.redirect("/urls")
    } else {
    let shortURL = req.params.id;
    delete urlsDatabase[req.currentUser.id][shortURL];
    res.redirect("/urls");
    }
  }
});

app.get("/urls/:id/edit", function(req, res) { //working
    if (!req.currentUser) {
      res.redirect("/login")
    } else {
      let templateVars = {
      shortURL: req.params.id,
      fullURL: urlsDatabase[req.currentUser.id][this.shortURL]
      }
    res.render("urls_show", templateVars);
    };
});

function generateRandomString() {
  return Math.random().toString(36).substr(2, 6);
}

function generateRandomUserID () {
  return Math.random().toString(36).substr(2, 20);
}

function fixURL (orignalURL) {
  if ((!orignalURL.includes("://"))) {
    orignalURL = "https://" + orignalURL;
  }
  return orignalURL;
}

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});