/**
 * Created by ThanhTV0612 on 5/17/16.
 */
'use strict'

const apiai = require('apiai');
const uuid = require('node-uuid');

const fbAPIRequest = require('./FacebookAPI');
const  databaseConnection = require('./Database');
const  util = require('../common/CommonUtil');

const FB_PAGE_ACCESS_TOKEN = "EAAIZAZB1QZCJjUBAFxK37a6N1pj6C4PuiAcGzv8C0M3vTlerS53D5q8Cx2s6FDySpgdExTBArtIBZCmyqZBit7ClgApuODgZAz7vSQ8YhUe7zM4pqsaOkFD0dZBYfZC3oMXFOSudWc5E0oEY1CF3PS8BJBZCRWQp9Lh4pWSq7NjotmQZDZD";
const APIAI_ACCESS_TOKEN ='9685138af1cd40fc91ec8c0514532547';
const askFoodLocation = "AskFoodLocation";
const successMessage = "Success";
const FB_VERIFY_TOKEN = 'hello';
const app_apiai = apiai(APIAI_ACCESS_TOKEN);
const fbClient = fbAPIRequest(FB_PAGE_ACCESS_TOKEN);
var sender;

//express
var express = require('express');
var router = express.Router();
module.exports = router;
router.get('/', function (req, res) {
    if (req.query['hub.verify_token'] == FB_VERIFY_TOKEN) {
        res.send(req.query['hub.challenge']);
        setTimeout(function () {
            fbClient.doSubscribeRequest();
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
            console.log(event.message.text);

            //sender
            sender = event.sender.id;
            handleFacebookMessage(event.message.text);
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
                var rows = databaseConnection.connectToDatabase(params.Food, function (rows) {
                    for(var i = 0; i < rows.length; i++) {

                        fbClient.sendFBMessageTypeText(sender, rows[i].name);
                    }
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
