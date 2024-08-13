const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const connectEnsureLogin = require('connect-ensure-login');

const app = express();

// Connect to the 'authApp' database
mongoose.connect('mongodb://localhost/authApp');

const UserDetail = new mongoose.Schema({
    username: String,
    password: String
});

UserDetail.plugin(passportLocalMongoose);

const UserDetails = mongoose.model('userInfo', UserDetail, 'userInfo');

// Middleware
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true in production with HTTPS
        maxAge: 60000  // Set to 60 seconds for testing purposes
    }
}));

// Initialize Passport and restore authentication state, if any, from the session
app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
passport.use(UserDetails.createStrategy());
passport.serializeUser(UserDetails.serializeUser());
passport.deserializeUser(UserDetails.deserializeUser());

// Routes

// Register route
app.get('/register', (req, res) => {
    res.sendFile('html/register.html', { root: __dirname });
});

app.post('/register', (req, res) => {
    UserDetails.register(new UserDetails({ username: req.body.username }), req.body.password, (err, user) => {
        if (err) {
            console.log(err);
            return res.redirect('/register?error=Registration failed');
        }
        passport.authenticate('local')(req, res, () => {
            res.redirect('/');
        });
    });
});

// Login POST handler
app.post('/login', passport.authenticate('local', { failureRedirect: '/login?info=Login failed' }), (req, res) => {
    res.redirect('/');
});

// Serve login page
app.get('/login', (req, res) => {
    res.sendFile('html/login.html', { root: __dirname });
});

// Serve home page (accessible only when logged in)
app.get('/', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    res.sendFile('html/index.html', { root: __dirname });
});

// Serve private page (accessible only when logged in)
app.get('/private', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    res.sendFile('html/private.html', { root: __dirname });
});

// Logout route
app.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect('/login');
    });
});

// Return user information (accessible only when logged in)
app.get('/user', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
    res.send({ user: req.user });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
