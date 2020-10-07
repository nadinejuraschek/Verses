const User = require('../models/User'),
Post = require("../models/Post"),
Follow = require("../models/Follow");

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
        res.render("home-guest", { regErrors: req.flash("regErrors") });
    };
};

exports.ifUserExists = function(req, res, next) {
    User.findByUsername(req.params.username)
    .then(function(userDocument) {
        req.profileUser = userDocument;
        next();
    }).catch(function() {
        res.render("404");
    });
};

exports.profilePostsScreen = function(req, res) {
    // find posts by author id
    Post.findByAuthorId(req.profileUser._id)
    .then(function(posts) {
        res.render('profile', {
            currentPage: "posts",
            posts: posts,
            profileUsername: req.profileUser.username,
            profileAvatar: req.profileUser.avatar,
            isFollowing: req.isFollowing,
            isVisitorsProfile: req.isVisitorsProfile,
        });
    }).catch(function() {
        res.render("404");
    });
};

exports.profileFollowersScreen = async function(req, res) {
    try {
        let followers = await Follow.getFollowersById(req.profileUser._id);
        res.render('profile-followers', {
            currentPage: "followers",
            followers: followers,
            profileUsername: req.profileUser.username,
            profileAvatar: req.profileUser.avatar,
            isFollowing: req.isFollowing,
            isVisitorsProfile: req.isVisitorsProfile,
        });
    } catch {
        res.render("404");
    };
};

exports.profileFollowingScreen = async function(req, res) {
    try {
        let following = await Follow.getFollowingById(req.profileUser._id);
        res.render('profile-following', {
            currentPage: "following",
            following: following,
            profileUsername: req.profileUser.username,
            profileAvatar: req.profileUser.avatar,
            isFollowing: req.isFollowing,
            isVisitorsProfile: req.isVisitorsProfile,
        });
    } catch {
        res.render("404");
    };
};

exports.sharedProfileData = async function(req, res, next) {
    let isVisitorsProfile = false;
    let isFollowing = false;
    if (req.session.user) {
        isVisitorsProfile = req.profileUser._id.equals(req.session.user._id);
        isFollowing = await Follow.isVisitorFollowing(req.profileUser._id, req.visitorId);
    };

    req.isVisitorsProfile = isVisitorsProfile;
    req.isFollowing = isFollowing;
    next();
};