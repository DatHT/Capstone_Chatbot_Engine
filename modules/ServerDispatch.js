/**
 * Created by ThanhTV0612 on 5/17/16.
 */
'use strict'



var config = require('../common/app-config').config;
var fbAPIRequest = require('./../common/FacebookAPI').FacebookAPI;
var url = require('url');
var fbMessageHandler = require('./FacebookHandler/FacebookMessageHandler');
var userMappingObject = new Map();
// FB Client
var fbClient = new fbAPIRequest(config.FACEBOOK_TOKEN.FB_PAGE_ACCESS_TOKEN);

const FB_VERIFY_TOKEN = config.FACEBOOK_TOKEN.VERIFY_TOKEN;
//express
var express = require('express');
var router = express.Router();

module.exports = router;
router.get('/', function (req, res) {
    if (req.query['hub.verify_token'] == FB_VERIFY_TOKEN) {
        res.send(req.query['hub.challenge']);
        setTimeout(function () {
            fbClient.doSubscribeRequest();
            fbClient.createGetStartButton(function () {
                console.log('create start button successfully');
            });
            fbClient.createGreetingText(function () {
                console.log('create greeting message successfully');
            })
            fbClient.createPersistentMenu(function () {
                console.log('create persistent menu successfully');
            })

        }, 3000);
    } else {
        res.send('Error, wrong validation token');
    }
});

router.get('/test', function (req, res) {
    // new Promise(function (resolve, reject) {
    //     // A mock async action using setTimeout
    //     console.log('hello noew');
    //     setTimeout(function () {
    //         resolve(10);
    //     }, 3000);
    // })
    //     .then(function (num) {
    //         console.log('first then: ', num);
    //         return new Promise(function (resolve, reject) {
    //             setTimeout(function () {
    //                 resolve(num * 2);
    //             }, 3000);
    //         })
    //             .then(function (num) {
    //             console.log('second then: ', num);
    //             return num * 2;
    //         })
    //             .then(function (num) {
    //                 console.log('last then: ', num);
    //             });
    //     })


});


router.post('/', function (req, res) {
    try {
        var fbMessageHandlerObject = fbMessageHandler();
        fbMessageHandlerObject.handleFacebookMessageFromUser(req, userMappingObject);

        return res.status(200).json({
            status: "ok"
        });
    } catch (err) {
        console.log("ERROR: " + err);
        return res.status(400).json({
            status: "error",
            error: err
        });
    }
});







