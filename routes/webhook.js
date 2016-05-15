/**
 * Created by HuyTCM on 5/12/16.
 */
var express = require('express');
var router = express.Router();

var apiai = require('apiai');
var psib = apiai('4beab02405df448ab92bd3c7e55217ec');

const verify_token = '';

/* POST message */
router.get('/', function(req, res) {
    // if (req.query['hub.verify_token'] === verify_token) {
    //     res.send(req.query['hub.challenge']);
    // }
    var messageText = 'Ăn cơm ở đâu ngon?';
    var contexts = 'ala';
    // var param = {
    //     query : ['Ở Gò Vấp ăn cơm đâu ngon?'],
    //     contexts : [{abc : 'aa', bcd: 'bb'}]
    // };
    var request = psib.textRequest(messageText);

    request.on('response', function(response) {
        var params = response.result.parameters;
        var responseText = '';
        if (!params.location) {
            responseText = "Bạn muốn tìm ở khu vực nào?";
        } else {
            responseText = response.result.fulfillment.speech;
            // query database to get data
        }
        res.send(responseText);
        console.log(response);
    });

    request.on('error', function(error) {
        console.log(error);
    });

    request.end();

});
// router.post('/', function (req, res) {
//     var messaging_events = req.body.entry[0].messaging;
//     for (var i = 0; i < messaging_events.length; i++) {
//         var event = req.body.entry[0].messaging[i];
//         var sender = event.sender.id;
//         if (event.message && event.message.text) {
//             var text = event.message.text;
//         }
//     }
//     res.sendStatus(200);
// });

const token = '';

function sendTextMessage(sender, text) {
    var messageData = {
        text:text
    };
    var http = require('http');
    http.request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    });
}
module.exports = router;
