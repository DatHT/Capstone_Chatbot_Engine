/**
 * Created by ThanhTV0612 on 5/17/16.
 */
'use strict'

var apiai = require('apiai');
var uuid = require('node-uuid');
var config = require('../common/app-config').config;

var clientUser = require('./ClientUser');
var fbAPIRequest = require('./FacebookAPI').FacebookAPI;
var databaseConnection = require('./Database');
var util = require('../common/CommonUtil');

const askFoodLocation = "AskFoodLocation";
const successMessage = "Success";

const FB_VERIFY_TOKEN = config.FACEBOOK_TOKEN.VERIFY_TOKEN;

var app_apiai = apiai(config.API_AI.DEV_ACCESS_TOKEN);
var fbClient = new fbAPIRequest(config.FACEBOOK_TOKEN.FB_PAGE_ACCESS_TOKEN);

var userMappingObject = new Map();

var user;
var sender;
var data;

//express
var express = require('express');
var router = express.Router();
module.exports = router;

router.get('/', function (req, res) {
    if (req.query['hub.verify_token'] == FB_VERIFY_TOKEN) {
        res.send(req.query['hub.challenge']);
        setTimeout(function () {
            fbClient.doSubscribeRequest();
            // fbClient.sendWelcomeMessage();
        }, 3000);
    } else {
        res.send('Error, wrong validation token');
    }
});

router.get('/test', function (req, res) {
    console.log("ADADA");
});

router.post('/', function (req, res) {
    try {
        var messaging_events = req.body.entry[0].messaging;

        for (var i = 0; i < messaging_events.length; i++) {
            var event = req.body.entry[0].messaging[i];
            var sender = event.sender.id;
            console.log(event);
            if (event.message && event.message.text) {
                if (!userMappingObject.has(sender)) {
                    // check session ivalid
                    user = clientUser(uuid.v1(), sender);
                    userMappingObject.set(sender, user);
                } else {
                    var existUser = userMappingObject.get(sender);
                }

                var opt = {
                    sessionId: existUser.getSessionID()
                };
                handleFacebookMessage(event.message.text, opt, function (response) {
                    handleAPIResponse(response, existUser);
                });

            }

            //handle payload
            if (util.isDefined(event.postback)) {
                console.log("payload: " + JSON.stringify((event.postback)));
                var address = getLocation(event.postback.payload);
                user.sendFBMessageTypeText(address);
            }
        }
        return res.status(200).json({
            status: "ok"
        });
    } catch (err) {
        return res.status(400).json({
            status: "error",
            error: err
        });
    }
});

function getLocation(ID) {
    for (var i = 0; i < data.length; i++) {

        if (data[i].ID == ID) {
            return data[i].address;
        }
    }
    return "Chưa tìm thấy";
}

// api.ai processing
function handleFacebookMessage(statements, option, callback) {
    var request = app_apiai.textRequest(statements, option);

    request.on('response', function (response) {
        // handleAPIResponse(response);
        return callback(response);
    });

    request.on('error', function (error) {
        console.log(error);
        // return callback(error);
    });

    request.end();
}

function handleAPIResponse(response, user) {
    console.log(response);
    console.log("session id:" + user.getSessionID);
    var action = response["result"]["action"];
    var responseText = response.result.fulfillment.speech;
    if (response.status.code === 200) {
        // action ask with food + location
        if (action === askFoodLocation) {
            var splittedText = util.splitResponse(responseText);

            if (splittedText.length > 0 && splittedText.toString().trim() !== successMessage) {
                for (var i = 0; i < splittedText.length; i++) {
                    console.log(user.getSessionID, splittedText[i]);
                    user.sendFBMessageTypeText(splittedText[i]);
                }
            }

            if (splittedText.toString().trim() === successMessage) {
                var params = response.result.parameters;
                var sql = 'select * from food where name like "%' + params.Food + '%"' ;
                databaseConnection.connectToDatabase(sql, function (rows) {
                    console.log("callback");
                    console.log(rows[0].name);
                    data = rows;
                    if (rows.length > 0) {
                        var elementArray = [];
                        for (var i = 0; i < rows.length; i++) {
                            var structureObj = {};
                            structureObj.title = rows[i].name;
                            console.log("title-", structureObj.title);
                            var urls = "http://media.foody.vn/res/g9/84334/prof/s320x200/foody-mobile-640x400-jpg-635421657338858677.jpg";
                            structureObj.image_url = urls;
                            structureObj.subtitle = "Soft white cotton t-shirt is back in style";

                            var buttons = [];
                            var button1 = util.createButton("Xem chi tiết", "web_url", urls);
                            buttons.push(button1);
                            var button2 = util.createButton("Xem giá", "postback", urls);
                            buttons.push(button2);
                            var button3 = util.createButton("Xem địa chỉ", "postback", rows[i].ID);
                            buttons.push(button3);
                            structureObj.buttons = buttons;
                            elementArray.push(structureObj);
                        }
                        console.log(JSON.stringify(elementArray));
                        user.sendFBMessageTypeStructureMessage(elementArray);
                    }
                });

            }
        }
    }
}
module.exports = router;
