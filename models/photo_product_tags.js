"use strict";

module.exports = function(sequelize, DataTypes) {
  var ProductTags = sequelize.define("photo_product_tags", {
    selfieId : {
          field: 'user_photo_id',
          type: DataTypes.INTEGER
    },
    product_name: DataTypes.STRING,
    product_id : DataTypes.INTEGER,
    product_image_url : DataTypes.STRING,
    element_name : {
    	field : 'tag_type',
    	type: DataTypes.STRING
    },
    createdAt: {
          field: 'created_at',
          type: DataTypes.DATE
    },
  	updatedAt: {
	      field: 'updated_at',
	      type: DataTypes.DATE
  	} 
  });

  return ProductTags;
};
