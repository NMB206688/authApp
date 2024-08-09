const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const mongoose = require('mongoose');
const connectEnsureLogin = require('connect-ensure-login');
const passportLocalMongoose = require('passport-local-mongoose');

// Initialize Express
const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/MyDatabase', { useNewUrlParser: true, useUnifiedTopology: true });

// Define User Schema
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});

// Use passport-local-mongoose to handle hashing and salting of passwords
userSchema.plugin(passportLocalMongoose);

// Create User Model
const User = mongoose.model('User', userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Routes
app.get('/', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  res.sendFile(__dirname + '/html/index.html');
});

app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/html/login.html');
});

app.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login?info=Invalid credentials',
}));

app.get('/private', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  res.sendFile(__dirname + '/html/private.html');
});

app.get('/logout', (req, res) => {
  req.logout();
  res.sendFile(__dirname + '/html/logout.html');
});

app.get('/user', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  res.json({ user: req.user });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
