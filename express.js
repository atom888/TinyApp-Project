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

// GET /
// if user is logged in:
// redirect -> /urls
// if user is not logged in:
// redirect -> /login

app.get("/", function(req, res) {
  if (!req.currentUser) {
    res.redirect("/login");
  } else {
    res.redirect("/urls");
  }
});

// GET /urls
// if user is not logged in:
// returns a 401 response, HTML with a relevant error message and a link to /login
// if user is logged in:
// returns a 200 response, HTML with:
// the site header (see below)
// a table of urls the user has created, each row:
// short url
// long url
// edit button -> GET /urls/:id
// delete button -> POST /urls/:id/delete
// a link to "Create a New Short Link" -> /urls/new

app.get("/urls", function(req, res) { // working
  const currentUser = req.session.userID;
  if (!req.currentUser) {
    res.status(401);
    res.rebder("401");
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

// GET /urls/new
// if user is not logged in:
// returns a 401 response, HTML with:
// error message
// a link to /login
// if user is logged in:
// returns a 200 response, HTML with:
// the site header (see below)
// a form, which contains:
// text input field for the original URL
// submit button -> POST /urls


app.get("/urls/new", function(req, res) {
  if (!req.currentUser) {
    res.status(401);
    res.render("401")
  } else {
    res.status(200);
    res.render("urls_new", {
      email: req.currentUser.email
    });
  }
});

// GET /urls/:id
// if url w/ :id does not exist:
// returns a 404 response, HTML with a relevant error message
// if user is not logged in:
// returns a 401 response, HTML with a relevant error message and a link to /login
// if logged in user does not match the user that owns this url:
// returns a 403 response, HTML with a relevant error message
// if all is well:
// returns a 200 response, HTML with:
// the short url
// a form, which contains:
// the long url
// "update" button -> POST /urls/:id
// "delete" button -> POST /urls/:id/delete

app.get("/urls/:shortURL", function(req, res) { // working
  console.log('get("/urls/:shortURL"', req.params.shortURL);
  if (!req.currentUser) {
    res.status(401);
    res.render("401");
  }
  for(let user in urlsDatabase) {
    if(urlsDatabase[user][req.params.shortURL]) {
      if(user === req.currentUser.id) {
        let shortURL = req.params.shortURL;
        var fullURL = urlsDatabase[req.currentUser.id][req.params.shortURL];
        let templateVars = {
          shortURL: shortURL,
          fullURL: fullURL,
          username: req.session.userID,
          email: req.currentUser.email,
          hostname: req.get('host')
        };
        res.render("urls_show", templateVars)
      } else {
        res.status(403);
        res.render("403");
      }
    }
  }
  if (!fullURL) {
    res.status(404);
    res.render("404");
  }
});

// GET /u/:id
// if url with :id exists:
// redirect -> the corresponding longURL
// otherwise:
// returns a 404 response, HTML with a relevant error message

app.get("/u/:id", function(req, res) {
  for(let user in urlsDatabase) {
      if(urlsDatabase[user][req.params.id]) {
        let longURL = urlsDatabase[req.currentUser.id][req.params.id]
        res.redirect(longURL);
      } else {
        res.status(403);
        res.render("403")
      }
  }
  res.status(404);
  res.render("404");

});


app.get("/u/:shortURL", (req, res) => {
  for(let user in urlsDatabase) {
      if(urlsDatabase[user][req.params.shortURL]) {
        let longURL = urlsDatabase[req.currentUser.id][req.params.shortURL]
        res.redirect(longURL);
      } else {
        res.status(403);
        res.redirect("/urls")
      }
  }
  res.status(404);
  res.render("404");
});


// POST /urls
// if user is logged in:
// generates a shortURL, saves the link and associates it with the user
// redirect -> /urls/:id
// if user is not logged in:
// returns a 401 response, HTML with a relevant error message and a link to /login

app.post("/urls", function(req, res) {
  if (!req.currentUser) {
    res.status(401);
    res.render("401");
  }

  let longURL = fixURL(req.body.longURL);
  let shortURL = generateRandomString();
  urlsDatabase[req.currentUser.id][shortURL] = longURL;

  res.redirect(`/urls/${shortURL}`);
});


// GET /login
// if user is logged in:
// redirect -> /
// if user is not logged in:
// returns a 200 response, HTML with:
// a form which contains:
// input fields for email and password
// submit button -> POST /login

app.get("/login", function(req, res) {

  if (req.currentUser) {
    res.redirect("/urls");
  } else {
    res.status(200);
    res.render("login");
  }
});

// GET /register
// if user is logged in:
// redirect -> /
// if user is not logged in:
// returns a 200 response, HTML with:
// a form, which contains:
// input fields for email and password
// "register" button -> POST /register

app.get("/register", function(req, res) {

  if (req.currentUser) {
    res.redirect("/urls");
  } else {
    let templateVars = {
      email: req.session.userID
    };
    res.status(200);
    res.render("register", templateVars);
  }
});

// POST /register
// if email or password are empty:
// returns a 400 response, with a relevant error message
// if email already exists:
// returns a 400 response, with a relevant error message
// if all is well:
// creates a user
// encrypts their password with bcrypt
// sets a cookie
// redirect -> /

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


// POST /login
// if email & password params match an existing user:
// sets a cookie
// redirect -> /
// if they don't match:
// returns a 401 response, HTML with a relevant error message

app.post("/login", function(req, res) { //working

  let loginEmail = req.body.email;
  let loginPassword = req.body.password;

  let user = null;
  for (let userId in usersDatabase) {
    let userCandidate = usersDatabase[userId];
    if (userCandidate.email === loginEmail) {
      user = userCandidate;
    }
  }

  if (!user) {
    res.status(403).send("Incorrect email or password. Please register or check your password");
  } else {
    bcrypt.compare(loginPassword, user.password, function (err, passwordMatches) {
      if (err) {
        res.redirect("/login");
      } else if (!passwordMatches) {
        res.status(403).send("Incorrect email or password. Please register.");
      } else {
        req.session.userID = user.id;
        res.redirect("/urls");
      }
    });
  }
});

// POST /logout
// deletes cookie
// redirect -> /
// THE SITE HEADER:

// if a user is logged in, the header shows:
// user's email
// "My Links" link -> /urls
// logout button -> POST /logout
// if not logged in, the header shows:
// a link to the log-in page /login
// a link to the registration page /register

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

app.get("/urls/:id/edit", function(req, res) { // working
    if (!req.currentUser) {
      res.redirect("/login")
    } else {

      let templateVars = {
      shortURL: req.params.id,
      fullURL: urlsDatabase[req.currentUser.id][req.params.id],
      hostname: req.get('host')
      }
    res.render("urls_show", templateVars);
    };
});

app.post("/urls/:id/edit", function(req, res) {
  let newLongURL = req.body.longURL
  urlsDatabase[req.currentUser.id][req.params.id] = newLongURL;
  res.redirect("/urls");
});


// POST /urls/:id
// if url with :id does not exist:
// returns a 404 response, HTML with a relevant error message
// if user is not logged in:
// returns a 401 response, HTML with a relevant error message and a link to /login
// if user does not match the url owner:
// returns a 403 response, HTML with a relevant error message
// if all is well:
// updates the url
// redirect -> /urls/:id

app.post("/urls/:id", function(req, res) { // working
  console.log('post("/urls/:id"', req.params.id);
  if (!req.currentUser) {
    res.status(401);
    res.render("401");
  }
  if (req.params.id !== urlsDatabase[req.currentUser.id]) {
    res.status(404);
    res.render("404");
  }
  if (urlsDatabase[req.currentUser.id]) {
    let updatedURL = req.body.longURL;
    urlsDatabase[req.currentUser.id][req.params.id] = fixURL(updatedURL);
    res.redirect(`/urls/${req.params.id}`);
  } else {
    res.status(403);
    res.render("403");
  }
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