var AWS = require('aws-sdk');
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