const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const saltRounds = 12;
const cookieSession = require('cookie-session');


app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));



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

//display all URLs if logged in else send error message
app.get("/urls", (req, res) => {

  if(req.session.user === undefined || !usersDatabase[req.session.user.id]){
    res.send('Please register or log in first');
  };

  const userURLs = urlsForUser(req.session.user.id);
  const urls = {urls: userURLs, user: req.session.user};

  res.render("urls_index", urls);

});

//Render create new URL page if logged in, else redirect to log in
app.get("/urls/new", (req, res) => {
  const loginId = {user: req.session.user};

  if(req.session.user === undefined){
    res.redirect("/login");
  };

  res.render("urls_new", loginId);
});

//Render Register Page
app.get("/register", (req, res) => {
  const registerInfo = {user: req.session.user};

  res.render("register", registerInfo);
});


//Render Login Page
app.get("/login", (req, res) => {
  const loginInfo = {user: req.session.user};

  res.render("login", loginInfo);
});


//GET ENDPOINTS FOR ROUTE PARAMETERS

app.get("/urls/:shortURL", (req, res) => {

  if(req.session.user === undefined || !usersDatabase[req.session.user.id]){
    res.send('Please register or log in first');
  };

  const userURLs = urlsForUser(req.session.user.id);

  if(urlDatabase[req.params.shortURL] !== userURLs[req.params.shortURL]){
    res.send('This is not your TinyURL!');
  };

  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: req.session.user,
    urls: urlDatabase
  };

  res.render("urls_show", templateVars);

});

//Redirects any requests to its longURL
app.get("/u/:shortURL", (req, res) => {
  const userURLs = urlsForUser(req.session.user.id);

  if(!userURLs[req.params.shortURL]){
    res.send('This TinyURL does not exist!')
  } else {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  }

});




/* POST ROUTES/ENDPOINTS
    | ==================================================================================== */

//adds short and long URL to database and redirects user to the new generated URL page
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  const userID = req.session.user.id;

  urlDatabase[shortURL] = {
    longURL,
    userID
  };

  res.status(200);
  res.redirect(`/urls/${shortURL}`);
});

//update longURLs
app.post("/urls/:shortURL", (req, res) => {

  if(req.session.user === undefined || !usersDatabase[req.session.user.id]){
    res.send('Cannot update, you are not the owner of this Tiny URL');
  };

  urlDatabase[req.params.shortURL].longURL = req.body.longURL;
  res.redirect("/urls");
});


//delete shortURL from database
app.post("/urls/:shortURL/delete", (req, res) => {

  if(req.session.user === undefined || !usersDatabase[req.session.user.id]){
    res.send('You are not the owner of this Tiny URL');
  };

  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});


//Register, adds new users to the database
app.post("/register", (req, res) => {
  const {email, password} = req.body;
  const hashedPass = bcrypt.hashSync(password, saltRounds);


  if(email === "" || password === ""){
    res.status(400).send('Fields not filled out');
  };

  if(emailLookup(email)) {
    res.status(400).send('Email is already registered');
  };

  const userId = addNewUser(email, hashedPass);

  req.session.user = userId;
  res.redirect("/urls");


});


//login with user email and password checks
app.post("/login", (req, res) => {
  const {email, password} = req.body;
  const userId = userLookup(username = email);

  if(emailLookup(email)) {
    if(passwordCheck(password)){
      req.session.user = userId;
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
  req.session = null;
  res.redirect('/login');
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
    };
  };
  return false;
};

//User lookup in user Database
const userLookup = (username) => {
  for(let user in usersDatabase) {
    if(usersDatabase[user].email === username){
      return usersDatabase[user];
    };
  };
};

//Password check in user Database
const passwordCheck = (password) => {
  for(let user in usersDatabase) {
    if(bcrypt.compareSync(password, usersDatabase[user].password)){
      return true;
    };
  };
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
    };
  };
  return urls;
};


