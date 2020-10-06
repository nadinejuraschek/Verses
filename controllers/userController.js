const User = require('../models/User');

exports.mustBeLoggedIn = function(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        req.flash("errors", "You must be logged in to perform this action.");
        req.session.save(function() {
            res.redirect("/");
        });
    };
};

exports.login = function(req, res) {
    let user = new User(req.body);
    user.login().then(function(result) {
        // req.session.user = {} can be anything, can be used anywhere
        req.session.user = {
            _id: user.data._id,
            username: user.data.username,
            avatar: user.avatar
        };
        req.session.save(function() {
            res.redirect("/");
        });
    }).catch(function(err) {
        req.flash("errors", err);
        // manually save session, so page doesn't redirect before flash message is loaded
        req.session.save(function() {
            res.redirect("/");
        });
    });
};

exports.logout = function(req, res) {
    req.session.destroy(function() {
        res.redirect("/");
    });
};

exports.register = function(req, res) {
    console.log("in register function body");
    let user = new User(req.body);
    user.register().then(() => {
        req.session.user = {
            _id: user.data._id,
            username: user.data.username
        };
        req.session.save(function() {
            res.redirect("/");
        });
    }).catch((regErrors) => {
        regErrors.forEach(function(err) {
            req.flash("regErrors", err);
        });
        req.session.save(function() {
            res.redirect("/");
        });
    });
};

exports.home = function(req, res) {
    if (req.session.user) {
        res.render("home-dashboard");
    } else {
        res.render("home-guest", { errors: req.flash("errors"), regErrors: req.flash("regErrors") });
    };
};

exports.ifUserExists = function(req, res, next) {
    next();
};

exports.profilePostsScreen = function(req, res) {
    res.render('profile');
};