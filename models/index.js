"use strict";

var fs        = require("fs");
var path      = require("path");
var util = require('util');
var Sequelize = require("sequelize");
var env       = process.env.NODE_ENV || "development";
var config    = require(__dirname + '/../config/config.json')[env];
var sequelize = new Sequelize(config.database, config.username, config.password, config);
var db        = {};
// var config_sub    = require(__dirname + '/../config/config.json')["staging"];
// var sequelize_sub = new Sequelize(config_sub.database, config_sub.username, config_sub.password, config_sub);
// var db_sub       = {};

fs
  .readdirSync(__dirname)
  .filter(function(file) {
    return (file.indexOf(".") !== 0) && (file !== "index.js");
  })
  .forEach(function(file) {
        var model = sequelize.import(path.join(__dirname, file));
        db[model.name] = model;
    // var sub_model = sequelize_sub.import(path.join(__dirname, file));
    // db_sub[model.name] = sub_model;
  });

Object.keys(db).forEach(function(modelName) {
  if ("associate" in db[modelName]) {
    db[modelName].associate(db);
  }
});

// db.users.belongsToMany(db.products, {
//   through: db['product_favorites'],
//   foreignKey: 'user_id',
//   otherKey: 'product_id',
//   as: 'favoriteProducts',
//   constraints: false
// });

// db.user_photos.hasMany(db.photo_product_tags, {as: 'tags', foreignKey: 'selfieId'});
// db.user_photos.belongsTo(db.users, {as: 'user', foreignKey: 'user_id'});
// db.user_photos.hasOne(db.faces, {as: 'face', foreignKey: 'user_photo_id'});
// db.feedback_polls.hasMany(db.feedback_poll_options, {as: 'option', foreignKey: 'feedback_poll_id'});

// db_sub.sequelize_sub = sequelize_sub;
// db_sub.Sequelize_sub = Sequelize;
db.sequelize= sequelize;
db.Sequelize = Sequelize;
module.exports = db;
//module.exports.sub = db_sub;
