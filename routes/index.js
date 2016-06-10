var express = require('express');
var models  = require('../models');
var models_new  = require('../models_new');
var request = require('request');
var fs = require('fs');
var gm = require('gm');
var path = require('path');
var get_url = require("url"); 

var router = express.Router();

var btF_request = request.defaults({headers: {'content-type':'application/json'}});

router.get('/index', function(req, res, next) {
  	get_insgest_photo();
  	
});

router.get('/', function (req, res, next) {
	res.render('index', {title: 'Index'});
});



router.get('/test', function(req, res, next) {
  models.data_values.findAll().then(function(users) {
     console.log('xxxxxx' + JSON.stringify(users));
  });
  // models_sub.data_values.findAll().then(function(users) {
  //    console.log('ttttttttt ------------' + JSON.stringify(users));
  // });  
});

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
//get_insgest_photo();
//get_have_face_photos();
//setInterval(get_insgest_photo, 20000);
//setInterval(get_have_face_photos, 20000);
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


function check_bench_mark(){
	models.user_photos.findAll({
		limit : 10
	}).then(function(data) {
		for (i = 0; i < data.length; i++) {
			console.log(data[i]);
		}
  	})
  	.catch(function(error) {
      	console.log(error + '  error');
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
	models.ing_photos.findAll({
		limit : 40,
		where : ['have_face is null'],
		order : 'id desc'
	}).then(function(data) {
		for (i = 0; i < data.length; i++) {
			detach_face(data[i].original_url.split("?")[0], data[i].id);
		}
  	})
  	.catch(function(error) {
      	console.log(error + '  error');
  	});
}

function get_have_face_photos(){
	models.ing_photos.findAll({
		limit : 100,
		where : ['have_face > 0 and status is null'],
		order : 'id desc'
	}).then(function(data) {
		for (i = 0; i < data.length; i++) {
			insert_to_ing_photos_betaface(data[i].original_url.split("?")[0], data[i].id);
		}
  	})
  	.catch(function(error) {
      	console.log(error + '  error');
  	});
}

function insert_to_ing_photos_betaface(img_url, id){
	models.sequelize.query('INSERT INTO ing_photos_betaface (photo_id, main_photo_url) values ($1, "'+img_url+'")',
		{ bind: [id], type: models.sequelize.QueryTypes.INSERT} )
	.then(function (updateResult) {
		models.sequelize.query('UPDATE ing_photos set status="copied" WHERE id in ($1)',
		{ bind: [id], type: models.sequelize.QueryTypes.BULKUPDATE} )
		.then(function (updateResult) {
			console.log('update id : ' + id);
		});
		//console.log('insert id : ' + id);
	});
}

function detach_face(img_url, id){
	var stream = request(img_url);
	var req = request.post('http://172.31.179.63:5000/face_detector', function (err, resp, body) {
	  if (err) {
	    console.log('Error!');
	  } else {
	  		console.log(img_url);
	  		var have_face = 0;
	  		var data = JSON.parse(body);
	  		if(data.images[0].faces.length >0 )
		  		have_face  = data.images[0].faces.length; 
		  	models.sequelize.query('UPDATE ing_photos set have_face="'+have_face+'" WHERE id in ($1)',
			{ bind: [id], type: models.sequelize.QueryTypes.BULKUPDATE} )
			.then(function (updateResult) {
				console.log('update id : ' + id);
			});
	    //console.log('URL: ' + body);
	  }
	});
	var form = req.form();
	form.append('file', stream);
}

function select_photos_betaface (){
	models.sequelize.query('SELECT id, main_photo_url FROM ing_photos_betaface where uuid is null limit 500',
		{ type: models.sequelize.QueryTypes.SELECT} )
	.then(function (data) {
		for (i = 0; i < data.length; i++) {
			upload_img(data[i].main_photo_url.split("?")[0], data[i].id);
		}
	});
}

function upload_img(img_url, id){
	var reqq = btF_request.post(
	{
	    url: 'http://www.betafaceapi.com/service_json.svc/UploadImage',
	    body: JSON.stringify(
	        {
	        api_key:"d45fd466-51e2-4701-8da8-04351c872236",
	        api_secret:"171e8465-f548-401d-b63b-caf0dc28df5f",
	        detection_flags:"propoints,classifiers,extended",
	        url: img_url
	        })
	    },
	    //main handler function here:
	    function(error, response, body){
	        if (response.statusCode == 200) {
	        		var data = JSON.parse(body);
	        		if(data.img_uid != '00000000-0000-0000-0000-000000000000')
	        		{
	        			models.sequelize.query('UPDATE ing_photos_betaface set uuid ="'+data.img_uid+'" WHERE id in ($1)',
						{ bind: [id], type: models.sequelize.QueryTypes.BULKUPDATE} )
						.then(function (updateResult) {
							console.log('update id : ' + id);
	        			});
	        		}	
	        } else {
	            res.end(0);
	        }
	    }
	);
}
module.exports = router;
