"use strict";

module.exports = function(sequelize, DataTypes) {
  var IngPhoto = sequelize.define("ing_photos", {
      photo_url: DataTypes.STRING,
      original_url: DataTypes.STRING,
      status: DataTypes.STRING,  
      metadata : DataTypes.STRING, 
      system_id : DataTypes.INTEGER,
      have_face: DataTypes.INTEGER,
      createdAt: {
          field: 'created_at',
          type: DataTypes.DATE
      },
      updatedAt: {
          field: 'updated_at',
          type: DataTypes.DATE
      },

  });
  return IngPhoto;
};
