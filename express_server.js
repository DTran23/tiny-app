const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.set("view engine", "ejs");

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//database for urls
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//database for users
const usersDatabase = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

//Get endpoints =================================

app.get("/", (req, res) => {
  res.send("Hello!");
});


app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});


app.get("/urls", (req, res) => {
  const urls = {urls: urlDatabase, username: req.cookies['user_id']};
  res.render("urls_index", urls);
});



app.get("/urls/new", (req, res) => {
  const loginId = {username: req.cookies['user_id']};


  if(req.cookies.user_id === undefined){
    res.redirect("/login")
  }
  res.render("urls_new", loginId);

});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});


app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.cookies['user_id']};

  if(req.cookies.user_id.id === undefined){
    res.redirect('/login')
  } else {
    res.render("urls_show", templateVars);
  }

});


//register page
app.get("/register", (req, res) => {
  const registerInfo = {username: req.cookies['user_id']};
  res.render("register", registerInfo)
});

//login page
app.get("/login", (req, res) => {
  const loginInfo = {username: req.cookies['user_id']};
  res.render("login", loginInfo)
});


//POST endpoints =================================


//Register, adds new users to the database
app.post("/register", (req, res) => {
  const {email, password} = req.body;
  const id = generateRandomString();
  const user = {
    id,
    email,
    password,
  };

  if(email === "" || password === ""){
    res.sendStatus(400);
  }

  if(emailLookup(email)) {
    res.sendStatus(400);
  }

  usersDatabase[id] = user;

  res.cookie('user_id', usersDatabase[id]);
  res.redirect("/urls");

});

//adds short and long URL to database and redirects to corresponding shortURL page
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  const userId = req.cookies.user_id.id;

  urlDatabase[shortURL] = {longURL: longURL, userId: userId}  ;
  res.status(200);
  res.redirect(`/urls/${shortURL}`);
});


app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;

  res.redirect("/urls");
});

//delete shortURL from url list
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

//login with user email and password checks
app.post("/login", (req, res) => {
  const {email, password} = req.body;
  let user_id;
  let foundUser = false;

  for(let user in usersDatabase){
    if(email === usersDatabase[user].email){
      if (password === usersDatabase[user].password) {
        user_id = usersDatabase[user];
        foundUser = true;
      }
    }
  }

  if (foundUser) {
    res.cookie('user_id', user_id);
    res.redirect('/urls');
  } else {
    res.sendStatus(403)
    res.redirect('/login');
  }
});

//logout
app.post("/logout", (req, res) => {
  res.clearCookie('user_id')
  res.redirect('/urls');
});

//Helper functions =================================


//Random string generator
const generateRandomString = () => {
  return Math.random().toString(36).substring(2,8);
};

//Check for email in database
const emailLookup = (emailInfo) => {
  for(let user in usersDatabase) {
    if(usersDatabase[user].email === emailInfo){
      return true;
    }
  }
  return false;
};


