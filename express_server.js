const express = require("express");
const app = express();
const PORT = 5000; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const bcrypt = require('bcrypt');
const saltRounds = 12;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});



/* DATABASES
    | ==================================================================================== */

const urlDatabase = {
  "b2xVn2": {longURL: "http://www.lighthouselabs.ca", userID: "userRandomID"},
  "9sm5xK": {longURL: "http://www.google.com", userID: "user2RandomID"}
};

const usersDatabase = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "pu"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

/* GET ROUTES/ENDPOINTS
    | ==================================================================================== */

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {

  if(req.cookies.user_id === undefined || !usersDatabase[req.cookies.user_id.id]){
    res.send('Please register or log in first');
  }

  const userURLs = urlsForUser(req.cookies.user_id.id);
  const urls = {urls: userURLs, user: req.cookies['user_id']};

  res.render("urls_index", urls);


});

app.get("/urls/new", (req, res) => {
  const loginId = {user: req.cookies['user_id']};

  if(req.cookies.user_id === undefined){
    res.redirect("/login")
  }

  res.render("urls_new", loginId);
});

//Render Register Page
app.get("/register", (req, res) => {
  const registerInfo = {user: req.cookies['user_id']};
  res.render("register", registerInfo)
});


//Render Login Page
app.get("/login", (req, res) => {
  const loginInfo = {user: req.cookies['user_id']};

  res.render("login", loginInfo)
});


//GET ENDPOINTS FOR ROUTE PARAMETERS

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: req.cookies['user_id'],
    urls: urlDatabase
  };

  if(req.cookies.user_id === undefined || !usersDatabase[req.cookies.user_id.id]){
    res.send('Please register or log in first');
  }

    res.render("urls_show", templateVars);

});

//Redirects any requests to its longURL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;

  res.redirect(longURL);
});




/* POST ROUTES/ENDPOINTS
    | ==================================================================================== */

//adds short and long URL to database and redirects user to the new generated URL page
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  const userID = req.cookies.user_id.id;

  urlDatabase[shortURL] = {
    longURL,
    userID
  };

  res.status(200);
  res.redirect(`/urls/${shortURL}`);
});

//update longURLs
app.post("/urls/:shortURL", (req, res) => {

  if(req.cookies.user_id === undefined || !usersDatabase[req.cookies.user_id.id]){
    res.send('Cannot update, you are not the owner of this Tiny URL');
  }

  urlDatabase[req.params.shortURL].longURL = req.body.longURL;
  res.redirect("/urls");
});


//delete shortURL from database
app.post("/urls/:shortURL/delete", (req, res) => {

  if(req.cookies.user_id === undefined || !usersDatabase[req.cookies.user_id.id]){
    res.send('You are not the owner of this Tiny URL');
  }

  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});


//Register, adds new users to the database
app.post("/register", (req, res) => {
  const {email, password} = req.body;
  const hashedPass = bcrypt.hashSync(password, saltRounds);

  if(email === "" || password === ""){
    res.status(400).send('Fields not filled out');
  }

  if(emailLookup(email)) {
    res.status(400).send('Email is already registered');
  }

  const userId = addNewUser(email, hashedPass);
  res.cookie('user_id', userId);
  res.redirect("/urls");

});


//login with user email and password checks
app.post("/login", (req, res) => {
  const {email, password} = req.body;
  const userId = userLookup(username = email);

  if(emailLookup(email)) {
    if(passwordCheck(password)){
      res.cookie('user_id', userId);
      res.redirect('/urls');
    } else {
      res.status(403).send('Password does not match');
    }
  } else {
    res.status(403).send('Email is not registered');
  }
});

//logout clear cookie and redirect to main page
app.post("/logout", (req, res) => {
  res.clearCookie('user_id')
  res.redirect('/urls');
});


/* HELPER FUNCTIONS
    | ========================================================================== */

//Random string generator
const generateRandomString = () => {
  return Math.random().toString(36).substring(2,8);
};

//Check for email in database
const emailLookup = (email) => {
  for(let user in usersDatabase) {
    if(usersDatabase[user].email === email){
      return true;
    }
  }
  return false;
};

//User lookup in user Database
const userLookup = (username) => {
  for(let user in usersDatabase) {
    if(usersDatabase[user].email === username){
      return usersDatabase[user];
    }
  }
};

//Password check in user Database
const passwordCheck = (password) => {
  for(let user in usersDatabase) {
    if(bcrypt.compareSync(password, usersDatabase[user].password)){
      return true;
    }
  }
  return false;
};

//Add new users
const addNewUser = (email, password) => {
  const id = generateRandomString();

  const newUser = {
    id,
    email,
    password,
  }

  usersDatabase[id] = newUser;

  return usersDatabase[id];
};

//Returns URLs that belong to the user
const urlsForUser = (userID) => {
  let urls = {};
  for(let shortURL in urlDatabase){
    if(urlDatabase[shortURL].userID === userID){
      urls[shortURL] = urlDatabase[shortURL];
    }
  }
  return urls;
}


