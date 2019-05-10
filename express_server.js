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
  const loginId = {username: usersDatabase[id]};
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
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: usersDatabase[id]};
  res.render("urls_show", templateVars);
});

//GET endpoint for register page
app.get("/register", (req, res) => {
  res.render("register")
});

//POST endpoint for registration
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

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;

  urlDatabase[shortURL] = longURL;
  res.status(200);
  res.redirect(`/urls/${shortURL}`);
});


app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;

  res.redirect("/urls");
});


app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  res.cookie('user_id', usersDatabase[id]);
  res.redirect('/urls');
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id')
  res.redirect('/urls');
});


const generateRandomString = () => {
  return Math.random().toString(36).substring(2,8);
};


const emailLookup = (emailInfo) => {
  for(let user in usersDatabase) {
    if(usersDatabase[user].email === emailInfo){
      return true;
    }
  }
  return false;
};


