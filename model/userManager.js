
// var bcrypt = require("bcrypt-nodejs-as-promised");
var crypto = require("crypto");
var validator = require("../public/js/validator");
var _ = require('lodash-node');

module.exports = function (db) {
  var registry = db.collection("user");
  console.log("userManager connect yes!!");

  return {

    createUser: function (user) {
      var sha1 = crypto.createHash("sha1");
      sha1.update(user.password);
      user.password = sha1.digest('hex');
      return registry.insert(user);
    },

    checkUserValid: function (user) {
      var errorMessages;

      for(var key in user) {
        if (!validator.isFieldValid(key, user[key])) {
          if (!errorMessages) errorMessages = {};
          errorMessages[key] = validator.form[key].errorMessage;
        }
      }
      return errorMessages;
    },

  　checkUserUnique: function (user) {
      return registry.findOne(getQueryForUniqueInAttr(user))
        .then(function (existedUser){
          return new Promise(function (resolve, reject){
            if (existedUser) {
              var errorMessages = {};
              errorMessages.username = "user isn't unique! Maybe in Username|StudentId|email|Phone";
              reject(errorMessages);
            } else {
              resolve();
            }
          });
        });
    },

    checkUserMatch: function (user) {
      var errorMessages = undefined;

      return registry.findOne({username: user.username}).then(function (registeredUser) {
        // 获取到用户接着检验是否密码正确;
        return new Promise(function (resolve, reject) {
            if (registeredUser) {
              var sha1 = crypto.createHash("sha1");
              sha1.update(user.password);
              if (registeredUser.password == sha1.digest('hex')) {
                  resolve(registeredUser);
                } else {
                  if (!errorMessages) errorMessages = {};
                  errorMessages.password = "密码不正确，请重新尝试";
                  reject(errorMessages);
                }
            } else {
              if (!errorMessages) errorMessages = {};
                errorMessages.username = "用户名不存在";
                reject(errorMessages);
              }
            });
        });
    },

    getUserInfo: function (username) {
      return registry.findOne({username: username}).then(function (registeredUser){
        return new Promise(function (resolve, reject){
          if (registeredUser) {
            var user = {};
            for (var attr in registeredUser) {
              if (registeredUser.hasOwnProperty(attr) && attr != "password") {
                user[attr] = registeredUser[attr];
              }
            }
            resolve(user);
          } else {
            reject("User is not found!!!");
          }
        });
      });
    },

    isAttrValueUnique: function (attr, value) {
      var check = {};
      check[attr] = value;
      return registry.findOne(check)
        .then(function (existedUser){
          return new Promise(function (resolve, reject){
            if (existedUser) {
              reject("key: " + attr + " is not unique by value: " + value);
            } else {
              resolve();
            }
          });
        });
    }

  };
}


function getQueryForUniqueInAttr(user) {
  return {
    $or: _(user).omit('password').pairs().map(pairToObject).value()
  };
}

function pairToObject(pair) {
  var obj = {};
  obj[pair[0]] = pair[1];
  return obj;
}
