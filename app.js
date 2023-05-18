require('dotenv').config();//to hide the secrete key
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlparser: true });

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});


userSchema.plugin(encrypt, { secret: process.env.SECRET ,encryptedFields: ['password']});
// userSchema.plugin(encrypt, { secret: secret, encryptedFeilds: ["password"] });

const User = new mongoose.model("User", userSchema);

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


///////////////////////////////////////////////// Get Methods //////////////////////////////////////////

app.get('/', function (req, res) {
    res.render('home');
});
app.get('/login', function (req, res) {
    res.render('login');
});
app.get('/register', function (req, res) {
    res.render('register');
});

///////////////////////////////////////////////// Post Methods //////////////////////////////////////////

app.post('/register', function (req, res) {
    console.log("out side" +req.body.username);
    User.findOne({ email: req.body.username }).then(function (foundUser) {
        if (!foundUser) {
            const newUser = new User({
                email: req.body.username,
                password: req.body.password
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
app.post('/login', function (req, res) {

    User.findOne({ email: req.body.username }).then(function (foundUser) {
        if (foundUser) {
            if (foundUser.password === req.body.password) {
                res.render('secrets');
            } else {
                res.send("<h1>Please,Check your email or password</h1>");
            }
        }
    }).catch(function (err) {
        res.send(err);
    });
});





app.listen(3000, function () {
    console.log("Server started on port 3000");
});