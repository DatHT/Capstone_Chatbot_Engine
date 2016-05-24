/**
 * Created by ThanhTV0612 on 5/17/16.
 */
'use strict'

var apiai = require('apiai');
var uuid = require('node-uuid');
var config = require('../common/app-config').config;

var fbAPIRequest = require('./FacebookAPI').FacebookAPI;
var databaseConnection = require('./Database');
var util = require('../common/CommonUtil');

const askFoodLocation = "AskFoodLocation";
const successMessage = "Success";

const FB_VERIFY_TOKEN = config.FACEBOOK_TOKEN.VERIFY_TOKEN;

var app_apiai = apiai(config.API_AI.DEV_ACCESS_TOKEN);
var fbClient = new fbAPIRequest(config.FACEBOOK_TOKEN.FB_PAGE_ACCESS_TOKEN);

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
            fbClient.sendWelcomeMessage();
        }, 3000);
    } else {
        res.send('Error, wrong validation token');
    }
});

router.get('/test', function (req, res) {
    console.log("ADADA");
})

router.post('/', function (req, res) {
    try {

        var messaging_events = req.body.entry[0].messaging;
        for (var i = 0; i < messaging_events.length; i++) {
            var event = req.body.entry[0].messaging[i];

            //sender
            sender = event.sender.id;
            //handle payload
            if(util.isDefined(event.postback)) {
                var textPayload = JSON.stringify((event.postback));

                console.log("Post back ne: " + event.postback.payload);
                var address = getLocation(event.postback.payload);
                console.log("Address ne: " + address);
                fbClient.sendFBMessageTypeText(sender, address);

            }else if (util.isDefined(event.message)){
                handleFacebookMessage(event.message.text);
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

function getPrice() {
    
}

function getLocation(ID) {
    for(var i = 0; i < data.length; i++) {
        
        if(data[i].ID == ID) {
            return data[i].address;
        }
    }
    return "Chưa tìm thấy";
}

// api.ai processing
function handleFacebookMessage(statements) {
    var request = app_apiai.textRequest(statements);

    request.on('response', function(response) {
        console.log(response);

        handleAPIResponse(response);
    });

    request.on('error', function (error) {
        console.log(error);
    });

    request.end();
}

function handleAPIResponse(response) {
    var  action = response["result"]["action"];
    var responseText = response.result.fulfillment.speech;

    if(response.status.code === 200) {
        // action ask with food + location
        if (action === askFoodLocation) {
            var splittedText = util.splitResponse(responseText);

            if(splittedText.length>0 && splittedText.toString().trim() !== successMessage) {
                for (var i = 0; i < splittedText.length; i++) {
                    console.log(sender, splittedText[i]);
                    // fbClient.sendFBMessageTypeText(sender, FB_PAGE_ACCESS_TOKEN ,splittedText[i]);
                    console.log(fbClient);
                    fbClient.sendFBMessageTypeText(sender, splittedText[i]);
                }
            }
            
            if(splittedText.toString().trim() === successMessage) {
                console.log("Vo database");
                var params = response.result.parameters;
                var sql = 'select * from food where name like "% ' + params.Food + ' %"';
                data = databaseConnection.connectToDatabase(sql, function (rows) {
                    data = rows;
                    var elementArray = [];
                    for(var i = 0; i < rows.length; i++) {

                        //fbClient.sendFBMessageTypeText(sender, rows[i].name);
                        var structureObj = {};
                        structureObj.title = rows[i].name;
                        console.log("title-", structureObj.title);
                        var urls = "http://media.foody.vn/res/g9/84334/prof/s320x200/foody-mobile-640x400-jpg-635421657338858677.jpg";
                        structureObj.image_url = urls;
                        var buttons = [];
                        var button1 = {};
                        button1.type = "web_url";
                        button1.url = urls;
                        button1.title = "Xem chi tiết";
                        buttons.push(button1);
                        var button2 = {};
                        button2.type = "postback";
                        button2.title = "Xem giá";
                        button2.payload = "Payload_Price";
                        buttons.push(button2);
                        var button3 = {};
                        button3.type = "postback";
                        button3.title = "Xem địa chỉ";
                        button3.payload = rows[i].ID;
                        buttons.push(button3);
                        structureObj.buttons = buttons;
                        elementArray.push(structureObj);
                    }
                    console.log(JSON.stringify(elementArray));
                    fbClient.sendFBMessageTypeStructureMessage(sender, elementArray);
                });

            }
        } else if(action !== askFoodLocation) {
            var responseAPI = response.result.resolvedQuery;
            console.log("Chua co mon an va dia diem");
            // var responseText = response.result.fulfillment.speech;
            // var responseData = response.result.fulfillment.data;


            if (util.isDefined(responseAPI)) {
                try {
                    fbClient.sendFBMessageTypeText(sender, responseAPI);

                } catch (err) {
                    fbClient.sendFBMessageTypeText(sender, {text: err.message });
                }
            }

        }
    }
}
module.exports = router;
