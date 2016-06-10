/**
 * Created by giang.tran on 4/18/16.
 */
"use strict";

module.exports = function(sequelize, DataTypes) {
	var Photos = sequelize.define("photos", {
		user_id : DataTypes.INTEGER,
		createdAt: {
			field: 'created_at',
			type: DataTypes.DATE
		},
		updatedAt: {
			field: 'updated_at',
			type: DataTypes.DATE
		},
		photo_title: DataTypes.STRING,
		source: DataTypes.STRING,
		original_created_date: DataTypes.DATE,
		original_updated_date: DataTypes.DATE,
		photo_url: DataTypes.STRING,
		event: DataTypes.STRING,
		nb_comment: DataTypes.INTEGER,
		nb_share: DataTypes.INTEGER,
		nb_favorite: DataTypes.INTEGER,
		original_url: DataTypes.STRING,
		status: DataTypes.STRING,
		original_id: DataTypes.INTEGER,
		metadata: DataTypes.STRING
	});
	return Photos;
};
