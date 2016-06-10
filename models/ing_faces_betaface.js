"use strict";

module.exports = function (sequelize, DataTypes) {
	var FacesBetaface = sequelize.define("faces_betaface", {
		photo_id: DataTypes.INTEGER,
		createdAt: {
			field: 'created_at',
			type: DataTypes.DATE
		},
		updatedAt: {
			field: 'updated_at',
			type: DataTypes.DATE
		},
		face_score: DataTypes.FLOAT,
		face_box: DataTypes.FLOAT,
		x_coor: DataTypes.FLOAT,
		y_coor: DataTypes.FLOAT,
		angle: DataTypes.FLOAT,
		age: DataTypes.INTEGER,
		race: DataTypes.STRING,
		chin: DataTypes.INTEGER,
		eyebrows_corners: DataTypes.INTEGER,
		eyebrows_size: DataTypes.INTEGER,
		eyebrows_position: DataTypes.INTEGER,
		eye_corners: DataTypes.INTEGER,
		eye_distance: DataTypes.INTEGER,
		eye_position: DataTypes.INTEGER,
		hair_beard: DataTypes.INTEGER,
		eye_shape: DataTypes.INTEGER,
		hair_forehead: DataTypes.INTEGER,
		hair_length: DataTypes.INTEGER,
		hair_sides: DataTypes.INTEGER,
		hair_top: DataTypes.INTEGER,
		hair_mustache: DataTypes.INTEGER,
		head_shape: DataTypes.INTEGER,
		head_width: DataTypes.INTEGER,
		mouth_height: DataTypes.INTEGER,
		mouth_corners: DataTypes.INTEGER,
		mouth_width: DataTypes.INTEGER,
		nose_width: DataTypes.INTEGER,
		nose_shape: DataTypes.INTEGER,
		hair_color_type: DataTypes.STRING,
		hair_color_type_confidence: DataTypes.DECIMAL(5, 4),
		eye_rgb: DataTypes.STRING,
		eye_rgb_confidence: DataTypes.DECIMAL(5, 4),
		skin_rgb: DataTypes.STRING,
		skin_rgb_confidence: DataTypes.DECIMAL(5, 4),
		clothes_rgb_sides: DataTypes.STRING,
		clothes_rgb_sides_confidence: DataTypes.DECIMAL(5, 4),
		clothes_rgb_middle: DataTypes.STRING,
		clothes_rgb_middle_confidence: DataTypes.DECIMAL(5, 4),
		hair_rgb: DataTypes.STRING,
		hair_rgb_confidence: DataTypes.DECIMAL(5, 4),
		gender: DataTypes.STRING,
		beard: DataTypes.INTEGER,
		expression: DataTypes.STRING,
		glasses: DataTypes.INTEGER,
		glasses_rim: DataTypes.INTEGER,
		teeth_visible: DataTypes.INTEGER,
		mustache: DataTypes.INTEGER,
		background_rgb: DataTypes.STRING,
		background_rgb_confidence: DataTypes.DECIMAL(5, 4),
		mustache_rgb: DataTypes.STRING,
		mustache_rgb_confidence: DataTypes.DECIMAL(5, 4),
		betaface_raw: DataTypes.STRING
	},{
		tableName: 'ing_faces_betaface'
	});
	return FacesBetaface;
};
