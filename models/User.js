const usersCollection = require("../db").collection("users");
const validator = require("validator");

let User = function(data) {
    this.data = data;
    this.errors = [];
};

User.prototype.cleanUp = function() {
    if (typeof(this.data.username) != "string") {
        this.data.username = "";
    };
    if (typeof(this.data.email) != "string") {
        this.data.email = "";
    };
    if (typeof(this.data.password) != "string") {
        this.data.password = "";
    };

    // get rid of any strange properties sent by the user
    this.data = {
        username: this.data.username.trim().toLowerCase(),
        email: this.data.email.trim().toLowerCase(),
        password: this.data.password
    };
};

User.prototype.validate = function() {
    if (this.data.username == "") {
        this.errors.push("You must provide a username!");
    };
    if (this.data.username != "" && !validator.isAlphanumeric(this.data.username)) {
        this.errors.push("Username can only contain letters and numbers.");
    };
    if (this.data.username.length > 0 && this.data.username.length < 3) {
        this.errors.push("Username must be at least 3 characters long.");
    };
    if (this.data.username.length > 30) {
        this.errors.push("Username can not exceed 30 characters.");
    };

    if (!validator.isEmail(this.data.email)) {
        this.errors.push("You must provide a valid email address!");
    };

    if (this.data.password == "") {
        this.errors.push("You must provide a password!");
    };
    if (this.data.password.length > 0 && this.data.password.length < 6) {
        this.errors.push("Password must be at least 6 characters.");
    };
    if (this.data.password.length > 100) {
        this.errors.push("Password can not exceed 100 characters.");
    };
};

User.prototype.login = function() {
    return new Promise((resolve, reject) => {
        this.cleanUp();
        usersCollection.findOne({ username: this.data.username }, (err, attemptedUser) => {
            // arrow functions do not manipulate or change the this keyword
            if (attemptedUser && attemptedUser.password == this.data.password) {
                resolve("Congrats!");
            } else {
                reject("Invalid username or password.");
            }
        });
    });
};

// method .register won't be created every time new User() gets called, more efficient
User.prototype.register = function() {
    // Step 1: validate user data
    this.cleanUp();
    this.validate();
    // Step 2: only if no errors, save user data to DB
    if (!this.errors.length) {
        usersCollection.insertOne(this.data);
    }
};

module.exports = User;