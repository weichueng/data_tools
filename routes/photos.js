var models = require('../models');
var models_data = require('../models_data');
var express = require('express');
var router = express.Router();
var fs = require("fs");
var path = require('path');
var get_url = require("url");
var multer = require('multer');
var gm = require('gm').subClass({imageMagick: true});
var request = require('request');
var constants = require('../const/const');

var json_request = request.defaults({headers: {'content-type': 'application/json'}});
//var Uploader = require('node-s3-uploader');
var keyid = 'AKIAJASEU4AIWAWB4Y4A';
var key = 'JT+GLU6Bios1cJBFUdNUYSK/XcpwdgYdLvLj3+VM';
var AWS = require('aws-sdk');
var mime = require('mime');
var async = require("async");
var md5 = require('md5');


var accessKeyId = process.env.AWS_ACCESS_KEY || keyid;
var secretAccessKey = process.env.AWS_SECRET_KEY || key;
var file_path = './';


AWS.config.update({
	accessKeyId: accessKeyId,
	secretAccessKey: secretAccessKey,
	path: 'photo/',
	region: 'us-west-2',
	acl: 'public-read'
});

var s3 = new AWS.S3();
var storage = multer.diskStorage({
	destination: function (req, file, callback) {
		callback(null, '.');
	},
	filename: function (req, file, callback) {
		callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
	}
});
var upload = multer({storage: storage}).single('image');


const data_processing_server = constants.data_processing_server;


function upload_image_s3(local_url, file_name, next_action) {

	var exten = path.extname(local_url);
	console.log('extname: '+exten);
	if (fs.existsSync(local_url)) {
		var bodystream = fs.createReadStream(local_url);
		var params = {
			Bucket: 'butterflyhub',
			Key: file_name,
			Body: bodystream,
			ContentEncoding: 'base64',
			ContentType: mime.lookup(local_url)
		};
		s3.upload(params, function (err, data) {
			if (err) {
				console.log("Error uploading data: ", err);
				next_action(null);
			} else {
				const cropped_url = data['Location'];
				next_action(cropped_url);
			}
			fs.unlink(local_url, (err) => {
				if (err) throw err;
				console.log('successfully deleted ' + local_url);
			});
		});
	}
	else {
		console.log('cannot find the file at: '+local_url);
		next_action(null);
	}
}


function crop_image(_model) {
	//console.log(_model.id);
	var faces = JSON.parse(_model['betaface_raw']);

	var max = faces['faces'][0]['height'];
	var x = Math.max(0, (faces['faces'][0]['x'] - (max * 0.75)));
	var y = Math.max(0, (faces['faces'][0]['y'] - (max * 0.75)));
	var height = 0;
	var width = 0;
	var url = faces['original_filename'];
	var parsed = get_url.parse(url);
	var file = path.basename(parsed.pathname);

	var hash = md5(_model.id);

	var exten = path.extname(_model.photo_url.split("?")[0]);
	var filename = hash.substring(0, 10) + '_' + _model.id + '_' + new Date().getTime() + '.jpg';
	var stream = request(url);
	//console.log(stream);
	var image = gm(stream);
	image.size(function (err, size) {
			if (!err) {
				width = size.width;
				height = size.height;
				var crop = Math.min(max * 1.5, width - x, height - y);

				image.crop(crop, crop, x, y)
					.write(file_path+ filename, function (err) {
						if (!err) {
							models.faces
								.build({
									image_url: file_path+filename,
									user_photo_id: _model.id,
									xpoint: x,
									ypoint: y,
									s3_completed: 0
								})
								.save()
								.then(function (rs) {
									models.sequelize.query('UPDATE user_photos set face_completed = 1 WHERE id in ($1)',
										{bind: [_model.id], type: models.sequelize.QueryTypes.BULKUPDATE})
										.then(function (updateResult) {
											console.log(updateResult);
										});
								}).catch(function (error) {
								console.log(error);
							});
							//upload_image_s3(url, './public/uploads/resize.png', _model.id, x, y);
						}
						else console.log(err);
					});
			}
			else {
				models.faces
					.build({
						image_url: file_path + filename,
						user_photo_id: _model.id,
						xpoint: x,
						ypoint: y,
						s3_completed: 0
					})
					.save()
					.then(function (rs) {
						models.sequelize.query('UPDATE user_photos set face_completed = 2 WHERE id in ($1)',
							{bind: [_model.id], type: models.sequelize.QueryTypes.BULKUPDATE})
							.then(function (updateResult) {
								console.log(updateResult);
							});
					}).catch(function (error) {
					console.log(error);
				});
				console.log(err);
			}

		});
}

function  get_betaface_metadata_by_uuid(uuid, id)
{
	update_betaFace_metadata(photo_id, betaFace_uuid, function (result){
		setTimeout(function (){
			res.end(JSON.stringify(result));
		},2000);
	})
}



function update_betaFace_metadata(_photo_id, _betaFace_uuid, next) {
	console.log('check betaFace now');
	var reqq = json_request.post(
		{
			url: 'http://www.betafaceapi.com/service_json.svc/GetImageInfo',
			body: JSON.stringify(
				{
					api_key: "d45fd466-51e2-4701-8da8-04351c872236",
					api_secret: "171e8465-f548-401d-b63b-caf0dc28df5f",
					img_uid: _betaFace_uuid
				})
		},
		//main handler function here:
		function (error, response, body) {
			console.log('response from betaFace: '+ response.statusCode);
			if (error) {
				console.log(error);
				next(1);
			}
			if (response.statusCode == 200) {          //we have a response
				var data = JSON.parse(body);
				var int_response = data.int_response;
				if (int_response < 0) {         // Internal error of betaFace
																				// Save the response status and reason down to photo_betaFace table
					models.photo_betaface.findOrCreate({
						where: {id: _photo_id}
					}).then(function (photo_betafaces) {
						var photo_betaface = photo_betafaces[0];
						photo_betaface.betaFace_uuid = _betaFace_uuid;
						photo_betaface.betaFace_completed = false;
						photo_betaface.checksum = data.checksum;
						photo_betaface.int_response = int_response;
						photo_betaface.string_response = data.string_response;
						photo_betaface.save();
					});
					next(1);
				} else if (int_response == 1) {  // Image is still in Queue of betaFace.
					console.log('Still in queue');
					next(0);
				} else {
					models.photo_betaface.findOrCreate({
							where: {id: _photo_id}
						})
						.then(function (photo_betafaces) {
							var photo_betaface = photo_betafaces[0];
							photo_betaface.betaFace_uuid = _betaFace_uuid;
							photo_betaface.betaFace_completed = true;
							photo_betaface.checksum = data.checksum;
							photo_betaface.int_response = int_response;
							photo_betaface.string_response = data.string_response;
							if (data.faces != null){
								photo_betaface.face_count = data.faces.length;
							}
							photo_betaface.save();
						}).catch(function (error) {
						console.log(error);
					});
					process_face_betaface(data, _photo_id);
					next(1);
				}
			} else {
				//Any error
				console.log('result not 200: '+JSON.stringify(response));
				next(1);
			}
		}
	);
}


function process_face_betaface(data, _photo_id){
	models.ing_photos.findById(_photo_id, {attributes: ['user_id', 'photo_url']})
		.then(function(photo){
			var user_id = photo['user_id'];
			var faces = data.faces;
			if (faces) {  //check null
				var max_score = 0.0;
				faces.forEach( function(betaface){
					models.photo_faces.findOrCreate({where: {
							photo_id: _photo_id, user_id: user_id, uuid: betaface['uid']
						}})
						.then(function(photo_faces_result){
							var saved_photo_face = photo_faces_result[0];
							var photo_face_id = saved_photo_face.id;
							models_data.faces_betaface.findOrInitialize({where: {id: photo_face_id}})
								.then(function (result){
									var face_betaface = result[0];
									face_betaface.photo_id = _photo_id;
									convert_betaFace_result(face_betaface, betaface);
									face_betaface.save()
										.then(function(saved_face_betaface){
										var call_data_processing = json_request.post(
											{
												url: data_processing_server+'/photo/face_classify',
												body: JSON.stringify(
													{
														face_id: photo_face_id
													})
											},
											//main handler function here:
											function (error, response, body) {
												if (error){
													console.log(error);
												}
											}
										);
									});

									crop_face(face_betaface, photo_face_id, photo['photo_url'], function(s3_url){
										var max = face_betaface.face_box;
										saved_photo_face.update(
											{
												main_photo_url: photo['photo_url'],
												xpoint: Math.max(0, (face_betaface.x_coor - (max * 0.75))),
												ypoint: Math.max(0, (face_betaface.y_coor - (max * 0.75))),
												//uuid: betaface['uid'],
												hair_color: face_betaface.hair_color_type,
												age: face_betaface.age,
												race: face_betaface.race,
												gender: face_betaface.gender,
												betaFace_raw: face_betaface.betaFace_raw,
												cropped_face_url: s3_url,
												status: 'active'
											});
									});
									if (max_score < betaface['score']){
										max_score = betaface['score'];
										models.users.update({avatar_face_id:photo_face_id},{where:{id: user_id}});
									}
								});
						})
				} )     // END of for loop
			}
		});
}


function crop_face(face_betaface, new_id, original_url, do_things_with_returned_url){
		var max = face_betaface.face_box;
		var x = Math.max(0, (face_betaface.x_coor - (max * 0.75)));
		var y = Math.max(0, (face_betaface.y_coor - (max * 0.75)));
		var url = original_url;
		var hash = md5(new_id);

		var filename = hash.substring(0, 5) + '_' + new_id + '_square_crop.jpg';
		const stream = request(url);
		//console.log(stream);
		const file_path = filename;
		gm(stream).crop(max*1.5, max*1.5, x, y)
		.write(file_path, function (err) {
			if (!err) {
				upload_image_s3(file_path, filename, do_things_with_returned_url);
			}
			else {
				console.log(err);
				do_things_with_returned_url(null);
			}
		});
}

function convert_betaFace_result(face_betaface, betaface){
	var face_box = Math.min(betaface['height'],betaface['width']);
	face_betaface.angle = betaface['angle'];
	face_betaface.x_coor = betaface['x'];
	face_betaface.y_coor = betaface['y'];
	face_betaface.face_score = betaface['score'];
	face_betaface.face_box = face_box;
	for (var i = 0; i < betaface.tags.length; i++) {
		var key = betaface.tags[i].name;
		var value = betaface.tags[i].value;
		if (FACE_COLUMN_MAP[key]){
			face_betaface[FACE_COLUMN_MAP[key]] = (VALUE_MAP[value]) ? VALUE_MAP[value] : value;
		}
		if (FIELDS_REQUIRING_CONFIDENCE[key]){
			face_betaface[FIELDS_REQUIRING_CONFIDENCE[key]] = betaface.tags[i].confidence;
		}
	}
	face_betaface.betaFace_raw = JSON.stringify(betaface);
}


var FIELDS_REQUIRING_CONFIDENCE = {
	'color background': 'background_rgb_confidence',
	'color clothes middle': 'clothes_rgb_middle_confidence',
	'color eyes': 'eye_rgb_confidence',
	'color hair': 'hair_rgb_confidence',
	'color clothes sides': 'clothes_rgb_sides_confidence',
	'color mustache': 'mustache_rgb_confidence',
	'color skin': 'skin_rgb_confidence',
	'hair color type': 'hair_color_type_confidence'
};


var FACE_COLUMN_MAP = {
	'age': 'age',
	'beard': 'beard',
	'expression': 'expression',
	'gender': 'gender',
	'glasses': 'glasses',
	'mustache': 'mustache',
	'race': 'race',
	'chin size': 'chin',
	'color background': 'background_rgb',
	'color clothes middle': 'clothes_rgb_middle',
	'color eyes': 'eye_rgb',
	'color hair': 'hair_rgb',
	'color clothes sides': 'clothes_rgb_sides',
	'color mustache': 'mustache_rgb',
	'color skin': 'skin_rgb',
	'eyebrows corners': 'eyebrows_corners',
	'eyebrows position': 'eyebrows_position',
	'eyebrows size': 'eyebrows_size',
	'eyes corners': 'eye_corners',
	'eyes distance': 'eye_distance',
	'eyes position': 'eye_position',
	'eyes shape': 'eye_shape',
	'glasses rim': 'glasses_rim',
	'hair beard': 'hair_beard',
	'hair color type': 'hair_color_type',
	'hair forehead': 'hair_forehead',
	'hair length': 'hair_length',
	'hair mustache': 'hair_mustache',
	'hair sides': 'hair_sides',
	'hair top': 'hair_top',
	'head shape': 'head_shape',
	'head width': 'head_width',
	'mouth corners': 'mouth_corners',
	'mouth height': 'mouth_height',
	'mouth width': 'mouth_width',
	'nose shape': 'nose_shape',
	'nose width': 'nose_width',
	'teeth visible': 'teeth_visible'
};

var VALUE_MAP = {
	'wide': 4,
	'very thin': 1,
	'very thick': 5,
	'very short': 1,
	'very long': 5,
	'triangle': 4,
	'thin': 2,
	'thick': 4,
	'straight': 2,
	'small': 2,
	'short': 2,
	'round': 4,
	'rect': 4,
	'raised': 4,
	'none': 0,
	'narrow': 2,
	'low': 2,
	'long': 4,
	'large': 4,
	'high': 4,
	'heart': 2,
	'far': 4,
	'extra wide': 5,
	'extra triangle': 5,
	'extra thin': 1,
	'extra thick': 5,
	'extra straight': 1,
	'extra small': 1,
	'extra round': 5,
	'extra rect': 5,
	'extra raised': 5,
	'extra narrow': 1,
	'extra low': 1,
	'extra large': 5,
	'extra high': 5,
	'extra heart': 1,
	'extra far': 5,
	'extra close': 1,
	'extra': 3,
	'close': 2,
	'average': 3,
	'yes': 1,
	'no': 0
};


module.exports = router;

