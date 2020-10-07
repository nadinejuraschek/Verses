const ObjectID = require("mongodb").ObjectID,
usersCollection = require("../db").db().collection("users"),
followsCollection = require("../db").db().collection("follows"),
User = require("./User");

let Follow = function(followedUsername, authorId) {
  this.followedUsername = followedUsername;
  this.authorId = authorId;
  this.errors = [];
};

Follow.prototype.cleanUp = function() {
  if (typeof(this.followedUsername) != "string") {
    this.followedUsername = "";
  };
};

Follow.prototype.validate = async function(action) {
  // check if followedUsername exists in db
  let followedAccount = await usersCollection.findOne({ username: this.followedUsername });
  if (followedAccount) {
    this.followedId = followedAccount._id;
  } else {
    this.errors.push("You can not follow a user that does not exist.");
  };

  // check if user is already being followed
  let doesFollowAlreadyExist = await followsCollection.findOne({followedId: this.followedId, authorId: new ObjectID(this.authorId)});
  if (action == "create") {
    if (doesFollowAlreadyExist) {this.errors.push("You are already following this user.")}
  };
  if (action == "delete") {
    if (!doesFollowAlreadyExist) {this.errors.push("You are currently not following this user.")}
  };

  // prevent user from following herself/himself
  if (this.followedId.equals(this.authorId)) { this.errors.push("You can not follow yourself!" )};
};

Follow.prototype.create = function() {
  return new Promise(async (resolve, reject) => {
    this.cleanUp();
    await this.validate("create");
    if (!this.errors.length) {
      await followsCollection.insertOne({ followedId: this.followedId, authorId: new ObjectID(this.authorId) });
      resolve();
    } else {
      reject(this.errors);
    };
  });
};

Follow.prototype.delete = function() {
  return new Promise(async (resolve, reject) => {
    this.cleanUp();
    await this.validate("delete");
    if (!this.errors.length) {
      await followsCollection.deleteOne({ followedId: this.followedId, authorId: new ObjectID(this.authorId) });
      resolve();
    } else {
      reject(this.errors);
    };
  });
};

Follow.isVisitorFollowing = async function(followedId, visitorId) {
  let followDoc = await followsCollection.findOne({followedId: followedId, authorId: new ObjectID(visitorId)})
  if (followDoc) {
    return true;
  } else {
    return false;
  };
};

Follow.getFollowersById = function(id) {
  return new Promise(async (resolve, reject) => {
    try {
      let followers = await followsCollection.aggregate([
        { $match: { followedId: id } },
        { $lookup: { from: "users", localField: "authorId", foreignField: "_id", as: "userDoc" } },
        { $project: {
          username: { $arrayElemAt: [ "$userDoc.username", 0 ] },
          email: { $arrayElemAt: [ "$userDoc.email", 0 ] },
        }}
      ]).toArray();
      followers = followers.map(follower => {
        let user = new User(follower, true);
        return { username: follower.username, avatar: user.avatar };
      });
      resolve(followers);
    } catch {
      reject();
    };
  });
};

// Follow.getFollowingById = function(id) {
//   return new Promise(async (resolve, reject) => {
//     try {
//       let following = await followsCollection.aggregate().toArray();
//     } catch {

//     };
//   });
// };

module.exports = Follow;