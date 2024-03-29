var util = require('../common/CommonUtil');
var config = require('../common/app-config').config;
var url = require('url');
var express = require('express');
var router = express.Router();
var databaseConennection = require('./DBManager/Database');

/* GET home page. */
router.get('/', function(req, res) {
    console.log('redirect');
    var url_parts = url.parse(req.url, true);
    var query = url_parts.query;
    var tempNumOfSearch = parseInt(query.numOfSearch) + 1;
    var item = {
        productId: query.productId,
        addressId: query.addressId,
        numOfSearch: tempNumOfSearch
    }
    databaseConennection.updateNumberOfSearchProductAddress(item, function (rows, err) {
        if (!err) {
            console.log('update num of search successfully');
        } else {
            console.log(err);
        }
    })
    console.log(item);
    console.log(decodeURI(query.link));
    res.redirect(decodeURI(query.link));
});

router.post('/test', function(req, res) {
    console.log('test');
    console.log('user id:' +  req.body.userid);
    console.log('fullname:' +  req.body.fullname);

});

module.exports = router;