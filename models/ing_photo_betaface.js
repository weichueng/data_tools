/**
 * Created by giang.tran on 4/18/16
 */
"use strict";

module.exports = function(sequelize, DataTypes) {
	return sequelize.define("photo_betaface", {
		createdAt: {
			field: 'created_at',
			type: DataTypes.DATE
		},
		updatedAt: {
			field: 'updated_at',
			type: DataTypes.DATE
		},
		betaFace_uuid: DataTypes.STRING,
		betaFace_completed: DataTypes.INTEGER,
		face_count: DataTypes.INTEGER,
		version: DataTypes.STRING,
		status: DataTypes.STRING,
		checksum: DataTypes.STRING,
		int_response: DataTypes.INTEGER,
		string_response: DataTypes.STRING
	}, {
		tableName: 'photo_betaFace'
	});
};
