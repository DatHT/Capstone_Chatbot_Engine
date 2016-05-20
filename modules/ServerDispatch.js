/**
 * Created by ThanhTV0612 on 5/17/16.
 */
'use strict'

const apiai = require('apiai');
const uuid = require('node-uuid');

const fbAPIRequest = require('./FacebookAPI');

const FB_PAGE_ACCESS_TOKEN = 'EAAYSqRpxAJABABOfTxnO9WemrfGKKJIuwONQ2D6nEZB8OCDGI7lb4sfO3y1Imi8ZBryzUUd6cHwWIK3fBXhms2HZAJQZAMaJzzOCWw1op22ZCrxYKAkbEnWm68iiMPWZBKPobc9EKxVlLDZB9r55zKrxIuiOs81cPGkEufpZA1Eta2mXHncn2SDO';
const APIAI_ACCESS_TOKEN ='57cb248ef96449b88f14b554f0f42793';
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
            var splittedText = splitResponse(responseText);
            if(splittedText.length>0 && splittedText !== successMessage) {
                for (var i = 0; i < splittedText.length; i++) {
                    console.log(sender, splittedText[i]);
                    // fbClient.sendFBMessageTypeText(sender, FB_PAGE_ACCESS_TOKEN ,splittedText[i]);
                    console.log(fbClient);
                    fbClient.sendFBMessageTypeText(sender, splittedText[i]);
                }
            }
        }
    }
}

//handle response to messenger
function splitResponse(str) {
    if (str.length <= 320)
    {
        return [str];
    }

    var result = chunkString(str, 300);

    return result;

}

function chunkString(s, len) {
    var curr = len, prev = 0;

    var output = [];

    while(s[curr]) {
        if(s[curr++] == ' ') {
            output.push(s.substring(prev,curr));
            prev = curr;
            curr += len;
        }
        else
        {
            var currReverse = curr;
            do {
                if(s.substring(currReverse - 1, currReverse) == ' ')
                {
                    output.push(s.substring(prev,currReverse));
                    prev = currReverse;
                    curr = currReverse + len;
                    break;
                }
                currReverse--;
            } while(currReverse > prev)
        }
    }
    output.push(s.substr(prev));
    return output;
}

