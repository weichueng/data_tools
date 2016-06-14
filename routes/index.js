var express = require('express');
var models  = require('../models');
var models_new  = require('../models_new');
var request = require('request');
var fs = require('fs');
var gm = require('gm');
var path = require('path');
var get_url = require("url"); 
var async = require('async');

var router = express.Router();
var run_detach_face = false, run_photo_betaface = false, run_update_face = false, run_send_betaface = false;
var flag = 1; 
var btF_request = request.defaults({headers: {'content-type':'application/json'}});


//************
// all function 
//************

//get_all_have_face();
//select_photos_betaface();
get_insgest_photo();
//get_have_face_photos();

//setInterval(get_all_have_face, 20000);
setInterval(get_insgest_photo, 20000);
setInterval(get_have_face_photos, 20000);
//setInterval(select_photos_betaface, 20000);

//***********
// end function 
//***********

router.get('/', function (req, res, next) {
	res.render('index', {title: 'Index'});
});

function get_all_have_face (){
	if (!run_update_face)
	{
		run_update_face = true;
		models.ing_photos.findAll({
			limit : 50,
			where : ['have_face > 0'],
			order : 'id desc'
		}).then(function(data) {
			console.log('totalcount : '+data.length);
			update_have_face_to_null(data);
		})
		.catch(function(error) {
			console.log(error + '  error');
		});
	}
	
}

function update_have_face_to_null(datas)
{
	async.mapLimit(datas, 3,
		function(data_value, callback){
			console.log(data_value.id);
			data_value.have_face = null;
			data_value.status = null;
			data_value.save().then(function(saveObj){
				callback();
			});
		},
		function(err){
			console.log('done update have face to null');
			run_update_face = false;
		}
	);
}


function get_photo_betaface(){
	var query = 'SELECT b.id, a.main_photo_url, b.source FROM ing_photos_betaface as a '+
		'inner join ing_photos b on b.id = a.photo_id'+
		' where a.uuid is not null and b.system_id is null limit 1';
	models.sequelize.query(query,
		{ type: models.sequelize.QueryTypes.SELECT} )
	.then(function (data) {
		for (i = 0; i < data.length; i++) {
			//console.log(data[i]);
			var id = data[i].id;
			models_new.photos
			.build({user_id: 1, photo_url: data[i].main_photo_url, source: data[i].source})
			.save()
			.then(function (then) {
				// Send the images to betaFace
				models.sequelize.query('UPDATE ing_photos set system_id="'+then.id+'" WHERE id in ($1)',
				{ bind: [id], type: models.sequelize.QueryTypes.BULKUPDATE} )
				.then(function (updateResult) {
					console.log('success : ' + updateResult);
				});	
			}).catch(function (error) {
				console.log(error);
			});
			
		}
	});
}





// get_photo_betaface();
// setInterval(get_photo_betaface, 2000);
//select_photos_betaface();

//check_bench_mark();

//get_photo_system_id();
//setInterval(get_photo_system_id, 10000);

function get_photo_system_id(){
	var query = 'SELECT b.system_id, a.uuid, b.id FROM ing_photos_betaface as a '+
		'inner join ing_photos b on b.id = a.photo_id'+
		' where b.system_id is not null and (b.moved != 1 or b.moved is null) limit 1';
	models.sequelize.query(query,
		{ type: models.sequelize.QueryTypes.SELECT} )
	.then(function (data) {
		for (i = 0; i < data.length; i++) {
			console.log(data[i]);
			get_metadata(data[i].system_id, data[i].uuid, data[i].id);
		}
	});	
}

function get_metadata(system_id, uuid, id){
	var options = { method: 'POST',
	 url: 'http://192.168.11.103:3000/photos/get_photo_info',
	 headers: 
	  { 
	    'cache-control': 'no-cache',
	    'content-type': 'application/json' },
	 body: 
	  { photo_id: system_id,
	    uuid: uuid,
	    isAvatar: false },
	 	json: true 
	 };

	request(options, function (error, response, body) {
	if (error) throw new Error(error);
	 		console.log(body);	
	 	if(body == "1")
	 	{
	 		models.sequelize.query('UPDATE ing_photos set moved=1 WHERE id = $1',
			{ bind: [id], type: models.sequelize.QueryTypes.BULKUPDATE} )
			.then(function (updateResult) {
				console.log('update id : ' + id);
			});
	 	}
	});
}

function upload_img(){
	var reqq = btF_request.post(
	{
	    url: 'http://www.betafaceapi.com/service_json.svc/UploadImage',
	    body: JSON.stringify(
	        {
	        api_key:"d45fd466-51e2-4701-8da8-04351c872236",
	        api_secret:"171e8465-f548-401d-b63b-caf0dc28df5f",
	        detection_flags:"propoints,classifiers,extended",
	        url: data['Location']
	        })
	    },
	    //main handler function here:
	    function(error, response, body){
	        if (response.statusCode == 200) {
	            fs.unlink(url, (err) => {
	              if (err) throw err;
	              console.log('successfully deleted ' + url);
	            });


	            var jsonString = '{ "image_id" : "'+anotherTask.dataValues.id.toString()+'", "uid" : "'+JSON.parse(body).img_uid+'"   }';
	            var obj = JSON.parse(jsonString);
	            res.end(JSON.stringify(obj));
	        } else {
	            res.end(0);
	        }
	    }
	);
}

function get_insgest_photo(){
	if(!run_detach_face && flag == 1)
	{
		models.ing_photos.findAll({
			limit : 100,
			where : ['have_face is null'],
			order : 'id desc'
		}).then(function(data) {
			run_detach_face = true;
			console.log('get have face is null photo : ' + data.length);
			if(data.length>0)
			{
				 detach_face(data);
			}
		})
		.catch(function(error) {
			console.log(error + '  error');
		});
	}
}

function get_have_face_photos(){
	if(!run_photo_betaface && flag == 2)
	{
		//run_photo_betaface = true;
		run_photo_betaface = true;
		models.ing_photos.findAll({
			limit : 50,
			where : ['status is null and  have_face > 0 '],
			order : 'id desc'
		}).then(function(data) {
			//insert_to_ing_photos_betaface(data);
			
			console.log('get have face photo : ' + data.length);
			if(data.length>0)
			{
				 insert_to_ing_photos_betaface(data);
			}
		})
		.catch(function(error) {
			console.log(error + '  error');
		});
	}
}

function insert_to_ing_photos_betaface(datas){
	async.mapLimit(datas, 5,
		function(data_value, callback){
			models.sequelize.query('INSERT INTO ing_photos_betaface (photo_id, photo_url) values ($1, "'+data_value.original_url.split("?")[0]+'")',
				{ bind: [data_value.id], type: models.sequelize.QueryTypes.INSERT} )
			.then(function (updateResult) {
				models.sequelize.query('UPDATE ing_photos set status="copied" WHERE id in ($1)',
				{ bind: [data_value.id], type: models.sequelize.QueryTypes.BULKUPDATE} )
				.then(function (updateResult) {
					console.log('update id : ' + data_value.id);
					callback();
				});
			});
		},
		function(err){
			console.log('done insert to ing_photos_betaface');
			flag =1;
			run_photo_betaface = false;
		}
	);
}

function detach_face(datas){
	async.mapLimit(datas, 5,
		  function(data_value, callback){
			  var statusCode = 0;
		   	var stream = request(data_value.original_url.split("?")[0]);
			
			var req = request.post('http://172.31.179.63:5000/face_detector', function (err, resp, body) {
			if (err) {
				console.log('Error!');
			} else {
				var have_face = 0;
				if(testJSON(body)){
					var data = JSON.parse(body);
					if(data.images[0].faces.length >0 )
						have_face  = data.images[0].faces.length; 
					models.sequelize.query('UPDATE ing_photos set have_face="'+have_face+'", thumbnail="$2" WHERE id = $1',
					{ bind: [data_value.id, body], type: models.sequelize.QueryTypes.BULKUPDATE} )
					.then(function (updateResult) {
						console.log('update id : ' + data_value.id);
						callback();
					});
				}
				else
				{
					models.sequelize.query('UPDATE ing_photos set have_face="-1" WHERE id = $1',
					{ bind: [data_value.id], type: models.sequelize.QueryTypes.BULKUPDATE} )
					.then(function (updateResult) {
						console.log('error image : ' + data_value.original_url.split("?")[0]);
						callback();
					});
				}
			}
			});
			var form = req.form();
			form.append('file', stream);
		  },
		  function(err){
		    // All tasks are done now
		    console.log('done');
			flag =2;
			run_detach_face = false;
		  }
		);
}

function testJSON(text){
    try{
        JSON.parse(text);
        return true;
    }
    catch (error){
        return false;
    }
}

function select_photos_betaface (){
	if(!run_send_betaface)
	{
		models.sequelize.query('SELECT id, photo_url FROM ing_photos_betaface where betaFace_uuid is null limit 500',
		{ type: models.sequelize.QueryTypes.SELECT} )
		.then(function (data) {
			//for (i = 0; i < data.length; i++) {
				console.log('get photo send betaface : ' + data.length);
				run_send_betaface = true;
				upload_img(data);
				//upload_img(data[i].main_photo_url.split("?")[0], data[i].id);
			//}
		});
	}
	
}

function upload_img(datas){
	
	async.mapLimit(datas, 5,
		function(data_value, callback){
			console.log(data_value.photo_url);
			var reqq = btF_request.post(
			{
				url: 'http://172.31.31.219/service_json.svc/UploadImage',
				body: JSON.stringify(
					{
					api_key:"e39b493d-1190-40b5-85a1-4a6579da1498",
					api_secret:"ed36fa23-93c3-4b76-9225-158d78603940",
					detection_flags:"propoints,classifiers,extended",
					url: data_value.photo_url
					})
				},
				//main handler function here:
				function(error, response, body){
					if (response.statusCode == 200) {
							var data = JSON.parse(body);
							if(data.img_uid != '00000000-0000-0000-0000-000000000000')
							{
								models.sequelize.query('UPDATE ing_photos_betaface set betaFace_uuid ="'+data.img_uid+'" WHERE id = $1',
								{ bind: [data_value.id], type: models.sequelize.QueryTypes.BULKUPDATE} )
								.then(function (updateResult) {
									console.log('update betaface id : ' + data_value.id);
									callback();
								});
							}	
							callback();
					} else {
						console.log(0);
						callback();
					}
				}
			);
		},
		function(err){
			console.log('done send photo betaface');
			run_send_betaface = false;
		}
	);
	
}



module.exports = router;
