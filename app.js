require('dotenv').config(); //to hide the secrete key
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')



const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlparser: true });


const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate)
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, {
            id: user.id,
            username: user.username,
            picture: user.picture
        });
    });
});

passport.deserializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
    function (accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));

///////////////////////////////////////////////// Get Methods //////////////////////////////////////////

app.get('/', function (req, res) {
    console.log("entered");
    res.render('home');
});

app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile'] })
);

app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/secrets');
    });


app.get('/login', function (req, res) {
    res.render('login');
});
app.get('/register', function (req, res) {
    res.render('register');
});

app.get('/secrets', function (req, res) {
    User.find({"secret": {$ne:null}}).then(function (foundUser){
        if(foundUser){
            res.render("secrets",{userWithSecrets : foundUser})
        }
    });
});
app.get('/submit', function (req, res) {
    if (req.isAuthenticated()) {
        console.log("authenticated");
        res.render('submit');
    } else {
        console.log("authenticated2");
        res.redirect('/login');
    }
});


app.get('/logout', function (req, res) {
    console.log("/logout");
    req.logout(req.user, function (err) {
        if (err) {
            console.log(err);
        } else {
            res.redirect("/");
        }
    });
});
//otherWay to get logout page
// app.get("/logout", (req, res) => {
//     req.logout(req.user, err => {
//       if(err) return next(err);
//       res.redirect("/");
//     });
//   });

///////////////////////////////////////////////// Post Methods //////////////////////////////////////////


app.post('/register', function (req, res) {
    User.register({ username: req.body.username }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect('/register');
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect('/secrets');
            });
        }
    })
});
app.post('/login', function (req, res) {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    })

    req.login(user, function (err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect('/secrets');
            });
        }
    })
});

app.post('/submit', function (req, res) {
    const secretText = req.body.secret;
    console.log(req.user);
    User.findById(req.user.id).then(function(foundUser){
        if(foundUser){
            console.log("enter in the found");
            foundUser.secret = secretText;
            foundUser.save().then(function(){
                res.redirect('/secrets');
            });
        }
    });
});




app.listen(3000, function () {
    console.log("Server started on port 3000");
});





/*

// const bcrypt = require("bcrypt") // hashing 
// const saltRounds = 10;

app.post('/register', function (req, res) {
    bcrypt.hash(req.body.password, saltRounds,function(err,hash){
        User.findOne({ email: req.body.username }).then(function (foundUser) {
            if (!foundUser) {
                const newUser = new User({
                    email: req.body.username,
                    password: hash
                });
                newUser.save().then(function () {
                    console.log(newUser.email);
                    res.render('secrets');
                }).catch(function (err) {
                    console.error(err);
                });
            } else {
                res.send("<h1>You are already registered !</h1>");
            }
        })
    });
    console.log("out side" +req.body.username);

});


app.post('/login', function (req, res) {

    User.findOne({ email: req.body.username }).then(function (foundUser) {
        if (foundUser) {
            bcrypt.compare(req.body.password,foundUser.password,function (err,result){ //compair password
                if(result === true) {
                    res.render('secrets');
                }
                else {
                    res.send("<h1>Please,Check your email or password</h1>");
                }
            }) 
        }
    }).catch(function (err) {
        res.send(err);
    });
});

*/