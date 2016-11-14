// Lighthouse Labs - W2D2 - TinyApp Project //


// Dependencies //

const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require("cookie-parser");
app.use(cookieParser());

const bcrypt = require('bcrypt');
// const password = "purple-monkey-dinosaur"; // you will probably this from req.params
// const hashed_password = bcrypt.hashSync(password, 10);

// console.log(bcrypt.compareSync("purple-monkey-minn", hashed_password));

const cookieSession = require('cookie-session');
app.use(cookieSession ({
  name: 'session',
  keys: ["kittyboots", "secretkey"],
  maxAge: 24 * 60 * 60 * 1000
}));
// app.use(session({
//   secret: 'keyboard ninja cat',
//   resave: false,
//   saveUninitialized: true
// }))

app.set('trust proxy', 1)
app.set("view engine", "ejs");



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

    let shortURL = req.params.shortURL;
    let fullURL = lookupLongInUrls(res.locals.urls, shortURL)

    let templateVars = {
      shortURL: shortURL,
      fullURL: fullURL
    };
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
  // let email = req.body.email;
  // let password = bcrypt.hashSync(req.body.password, 10);

  for (var i in users) {
    if (req.body.email === users[i].email) {
      res.status(400);
      res.send('Email already taken!');
    }
  }

  users[userID] = {};
  users[userID].id = userID;
  users[userID].email = req.body.email;
  users[userID].password = bcrypt.hashSync(req.body.password, 10);

  res.redirect("/login");
});

app.post("/urls", (req, res) => {
  let longURL = req.body.longURL;
  let fixLongURL = fixURL(longURL);
  let shortURL = generateRandomString();

  var newObj = {
    shortURL: shortURL,
    longURL: fixLongURL
  };

  urlDatabase[req.currentUser.id].urls.push(newObj); /// able to push new url obj to DB

  if (!req.currentUser) {
    res.redirect("/login");
  }
  res.redirect(`/urls/${shortURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[req.currentUser.id].urls[shortURL];
  res.redirect(longURL);
});

app.post("/urls/:id/delete", (req, res) => {

  if (!req.cookies["userID"]) {
    res.redirect("/login");
  }
  let shortURL = req.params.id;
  let myUrls = urlDatabase[req.currentUser.id].urls;
  var removed = myUrls.splice(lookupIndexInUrls(myUrls, shortURL), 1);


  res.redirect("/urls/");
});

app.get("/urls/:id/edit", (req, res) => {

  if (!req.currentUser) {
    res.redirect("/login");
  } else {

    let indexValue = lookupIndexInUrls(res.locals.urls, req.params.id);

    let templateVars = {
      shortURL: req.params.id,
      fullURL: res.locals.urls[indexValue].longURL
    };
    res.render("urls_show", templateVars);
  }
});

app.post("/urls/:id", (req, res) => {


  let shortURL = req.params.id;
  let newLongURL = req.body.longURL;
  let fixLongURL = fixURL(newLongURL);
  let indexValue = lookupIndexInUrls(res.locals.urls, shortURL);

  res.locals.urls[indexValue].longURL = fixLongURL;

  if (!req.currentUser) {
    res.redirect("/login");
  } else {

    res.redirect(`/urls/${shortURL}/edit`);
  }
});

/// Cookie Work ///

app.get("/login", (req, res) => {

  if (req.cookies["userID"]) {
    res.redirect("/urls");
  } else {
    res.redirect("/register");
  }
});

app.post("/login", (req, res) => {

  let loginEmail = req.body.email;
  let loginPassword = req.body.password;

  let hashedPassword = bcrypt.hashSync(loginPassword, 10);



  let user = null;
  for (let userId in users) {
    let userCandidate = users[userId];
    if (userCandidate.email === loginEmail) {
      user = userCandidate;
    }

  console.log("user",user);
  console.log("users[userID]",users[userId]);
  console.log("loginEmail",loginEmail);
  console.log("userCandidate.email", userCandidate.email);

   }

  if (user === null) {
    res.status(403).send
  }


/////////////// Testing crypt

//   if (user === null) {
//     res.status(403).send("Incorrect email or password. Please register or check your password.");
//   } else {
//     bcrypt.compare(loginPassword, user.password, function (err, passwordMatches) {
//       if (err) {
//         res.redirect("/login");
//       }
//       if (!passwordMatches) {
//         res.status(401).send("401 Error");
//       } else {
//         req.session.userID = user.id;
//         // res.cookie('userID', users[i].id);
//         res.redirect("/urls");
//       }
//     });
//   }

// });

  // for (var i in users) {
  //   if (user === null) {
  //     res.status(403).send("Incorrect email or password. Please register or check your password.");
  //   } else {
  //     bcrypt.compare(loginPassword, user.password, function (err, passwordMatches) {
  //       if (err) {
  //         res.direct("/login");
  //       }
  //       if (!passwordMatches) {
  //         res.status(401).send("401 Error");
  //       } else {
  //         res.cookie('userID', users[i].id);
  //         res.redirect("/urls");
  //       }
  //     })
  //   }
  // }



///////////

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
  // req.session.userID = null;

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

function lookupIndexInUrls(urls, shortUrl){
  for (index in urls){
    if (urls[index].shortURL === shortUrl){
      return index;
    }
  }
};

function lookupLongInUrls(urls, shortUrl){
  let index = lookupIndexInUrls(urls, shortUrl);
  return urls[index].longURL;
};
