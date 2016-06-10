var express = require('express');
var models  = require('../models');
var AWS = require('aws-sdk');
var path = require('path');
var url = require("url");
var request = require('request');
var mime = require('mime');
var md5 = require('md5');
var gm = require('gm');
var fs = require("fs");


//global param
var router = express.Router();
var keyid = 'AKIAJASEU4AIWAWB4Y4A';
var key = 'JT+GLU6Bios1cJBFUdNUYSK/XcpwdgYdLvLj3+VM';
var accessKeyId =  process.env.AWS_ACCESS_KEY || keyid;
var secretAccessKey = process.env.AWS_SECRET_KEY || key;


AWS.config.update({
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
    path: 'photo/',
    region: 'us-west-2',
    acl: 'public-read'
});

var s3 = new AWS.S3();

router.post('/upload_image_s3', function(req, res, next) {
    var photo_url, photo_id;
    if(req.body.photo_url && req.body.photo_url)
    {
        photo_url = req.body.photo_url;
        photo_id = req.body.photo_id;

        var stream = request(photo_url);
        var hash = md5(photo_id);
        var filename = hash.substring(0,5) + '_'+ photo_id +'_' + new Date().getTime() + '.jpg';

            gm(stream, './img23.jpg')
            .write('./public/uploads/' +filename, function (err) {
                if (!err) 
                {
                    var local_url = './public/uploads/' +filename;
                     var exten = path.extname(local_url);
                     var parsed = url.parse(local_url);
                     // if exist image file
                     if (fs.existsSync(local_url)) {
                        var bodystream = fs.createReadStream(local_url);
                        //define params
                        var params = {
                                    Bucket: 'butterflyhub',
                                    Key: path.basename(parsed.pathname),
                                    Body: bodystream, 
                                    ContentEncoding: 'base64',
                                    ContentType: mime.lookup(local_url)
                                };
                        // update to  s3    
                        s3.upload(params, function (err, data) {
                                if (err) {
                                console.log("Error uploading data: ", err);
                                } else {
                                    fs.unlink(local_url, (err) => {
                                        if (err) throw err;
                                        console.log('successfully deleted ' + local_url);
                                    });
                                    //console.log(data);
                                    res.end(data['Location']);
                                }
                            });
                       }
                      
                }
                else console.log(err);
            });
    }
    else{
        res.end('format error');
    }
});

function get_photos_upload_s3(){
    models.ing_photos.findAll({
        limit : 40,
		where : ['have_face > 1 and photo_url is null']
    }).then(function (data){
        data.forEach(funcction)
    });
}

function upload_image_s3(photo_url, photo_id){
    var stream = request(photo_url);
    var hash = md5(photo_id);
    var filename = hash.substring(0,5) + '_'+ photo_id +'_' + new Date().getTime() + '.jpg';

    gm(stream, './img23.jpg')
    .write('./public/uploads/' +filename, function (err) {
        if (!err) 
        {
            var local_url = './public/uploads/' +filename;
                var exten = path.extname(local_url);
                var parsed = url.parse(local_url);
                // if exist image file
                if (fs.existsSync(local_url)) {
                var bodystream = fs.createReadStream(local_url);
                //define params
                var params = {
                            Bucket: 'butterflyhub',
                            Key: path.basename(parsed.pathname),
                            Body: bodystream, 
                            ContentEncoding: 'base64',
                            ContentType: mime.lookup(local_url)
                        };
                // update to  s3    
                s3.upload(params, function (err, data) {
                        if (err) {
                        console.log("Error uploading data: ", err);
                        } else {
                            fs.unlink(local_url, (err) => {
                                if (err) throw err;
                                console.log('successfully deleted ' + local_url);
                            });
                            //console.log(data);
                            res.end(data['Location']);
                        }
                    });
                } 
        }
        else console.log(err);
    });
}

function crop_face_upload_s3(){
    
}

module.exports = router;

