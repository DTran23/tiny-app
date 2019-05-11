const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

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

//Render Register Page
app.get("/register", (req, res) => {
  const registerInfo = {username: req.cookies['user_id']};
  res.render("register", registerInfo)
});


//Render Login Page
app.get("/login", (req, res) => {
  const loginInfo = {username: req.cookies['user_id']};
  res.render("login", loginInfo)
});

//GET ENDPOINTS FOR ROUTE PARAMETERS

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    username: req.cookies['user_id'],
    urls: urlDatabase
  };

  if(req.cookies.user_id === undefined){
    res.sendStatus(400)
  } else {
    res.render("urls_show", templateVars);
  }

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
  const userId = req.cookies.user_id.id;

  urlDatabase[shortURL] = {
    longURL,
    userId
  };

  res.status(200);
  res.redirect(`/urls/${shortURL}`);
});

//update longURLs
app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL].longURL = req.body.longURL;

  res.redirect("/urls");
});


//delete shortURL from database
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});


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
const emailLookup = (emailInfo) => {
  for(let user in usersDatabase) {
    if(usersDatabase[user].email === emailInfo){
      return true;
    }
  }
  return false;
};

// const urlsForUser = (id) => {
//   let url = [];
//   for(let shortURL in urlDatabase){
//     if(urlDatabase[shortURL].userID === req.cookies.user_id.id){
//       url.push(urlDatabase[shortURL].longURL)
//     }
//   }
//   return url;
// }

