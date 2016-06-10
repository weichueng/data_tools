var models = require('../models');
var express = require('express');
var router = express.Router();


var PAGE_SIZE = 30;


router.get('/', function (req, res, next) {
	//console.log(req.query.page);
	var page = parseInt(req.query.page);
	models.sequelize.query('SELECT id, main_photo_url as photo_url, status FROM ing_photos_betaface WHERE uuid is null LIMIT $1, $2',
		{bind: [PAGE_SIZE * (page - 1), PAGE_SIZE], type: models.sequelize.QueryTypes.SELECT}).then(function (data) {
			if (data.length == 0) {
				data.push({photo_url: "https://farm2.staticflickr.com/1678/24507426756_a1c5f20308_b.jpg", status: "test"});
				//console.log(data);
			}
			var list_data = [], id_list = [];
			for (i = 0; i < Math.min(data.length, PAGE_SIZE); i++) {
				var item = {};
				item.id = data[i].id;
				item.url = data[i].photo_url;
				item.status = data[i].status;
				list_data.push(item);
				id_list.push(item.id);
			}
			res.end(JSON.stringify(list_data));
		})
		.catch(function (error) {
			res.end(error + '  error');
		});
});


//Copy photos from Temp table to user_photos table
router.post('/updatePhoto', function (req, res, next) {
	var photo_id = req.body.id;
	models.sequelize.query('UPDATE ing_photos_betaface set status="active" WHERE id in ($1)',
	{bind: [photo_id], type: models.sequelize.QueryTypes.BULKUPDATE})
	.then(function (updateResult) {
		console.log(updateResult)
		res.end(JSON.stringify('success ' + updateResult));
	});
});


//Mark a photo as not good enough and will not copy into user_photo table
router.post('/cancelPhoto', function (req, res, next) {
	var photo_id = req.body.id;
	models.sequelize.query('UPDATE ing_photos_betaface set status="deactive" WHERE id in ($1)',
		{bind: [photo_id], type: models.sequelize.QueryTypes.BULKUPDATE})
		.then(function (updateResult) {
			console.log(updateResult)
			res.end(JSON.stringify('success ' + updateResult));
		}).catch(function (error) {
		res.end(error + '  error');
	});
});

function getConfigurationsForFeature(feature) {
	return models.sequelize.query('SELECT DISTINCT configurations as value, good FROM betaface_reviews WHERE face_features = $1',
		{bind: [feature], type: models.sequelize.QueryTypes.SELECT});
}

router.get('/configurations', function (req, res, next) {
	var feature = req.query.feature;
	getConfigurationsForFeature(feature).then(function (results) {
		res.end(JSON.stringify(results));
	});
});

module.exports = router;
