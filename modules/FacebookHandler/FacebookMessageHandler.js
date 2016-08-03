/**
 * Created by ThanhTV0612 on 6/29/16.
 */


var config = require('../../common/app-config').config;
var clientUser = require('../../model/ClientUser');
var util = require('../../common/CommonUtil');
var logHandle = require('../LogHandler/Logger');
var postbackHandler = require('./PostbackHandler/PostbackHandler');
var messageHandler = require('./MessageHandler/MessageHandler');
var attachmentHandler = require('./AttachmentsHandler/AttachmentsHandler');
var uuid = require('node-uuid');
var apiai = require('apiai');
var app_apiai = apiai(config.API_AI.DEV_ACCESS_TOKEN);
var databaseConnection = require('../DBManager/Database');
var quickReplyHandler = require('./MessageHandler/MessageQuickReply/MessageQuickReplyHandler');


module.exports = createFacebookMessageHandler;

function FacebookMessageHandler() {
    console.log('create new message handler')
}

function createFacebookMessageHandler() {
    return new FacebookMessageHandler();
}

FacebookMessageHandler.prototype.handleFacebookMessageFromUser = function (req, userMappingObject) {
    return handleFacebookMessageFromUser(req, userMappingObject);
};

function handleFacebookMessageFromUser(req, userMappingObject) {
    var messaging_events = req.body.entry[0].messaging;

    for (var i = 0; i < messaging_events.length; i++) {
        var event = req.body.entry[0].messaging[i];
        var sender = event.sender.id;

        console.log(event);
        // get current user
        var existUser;
        if (!userMappingObject.has(sender)) {
            existUser = clientUser(uuid.v1(), sender);
            userMappingObject.set(sender, existUser);
        } else {
            existUser = userMappingObject.get(sender);
        }



        // normal event message
        if (event.message ) {
            console.log('LOG: message type TEXT');
            handleFacebookMessageText(event,existUser, userMappingObject);
        }

        // handler postback
        if (event.postback) {
            console.log('LOG: message type POSTBACK');
            handleFacebookPostback(event, existUser, userMappingObject);
        }

        // handle log
        if (event.delivery) {
            console.log('LOG: message type DELIVERY');
            handleFacebookDeliver(existUser);
        }
        
        //handle attachment
        if (event.message && event.message.attachments) {
            console.log('LOG: message type ATTACHMENT');
            handleFacebookAttachments(event, existUser, userMappingObject);
        }
    }
}

// handle facebook message
function handleFacebookMessage(statements, option, callback) {
    var request = app_apiai.textRequest(statements, option);

    request.on('response', function (response) {
        return callback(response);
    });

    request.on('error', function (error) {
        console.log(error);
    });

    request.end();
}

function handleFacebookMessageText(event,existUser, userMappingObject) {
    if (event.message.text) {
        var opt = {
            sessionId: existUser.getSessionID()
        };
        var messageHandlerObject = messageHandler(existUser, userMappingObject);
        handleFacebookMessage(event.message.text, opt, function (response) {
            messageHandlerObject.doDispatchingMessage(response);
        });
    }
}

function handleFacebookMessageQuickReply(event,existUser, userMappingObject) {
    if (event.message.quick_reply) {
        var opt = {
            sessionId: existUser.getSessionID()
        };
        var quickReplyHandlerObject = quickReplyHandler(existUser, userMappingObject);
        quickReplyHandlerObject.handleQuickReplyMessage(event.message.quick_reply);
    }
}

function handleFacebookPostback(event, existUser, userMappingObject) {
    var postbackHandlerObject = postbackHandler(existUser, userMappingObject);
    if (event.postback.payload !== 'get_start') {
        var jsonObj = JSON.parse(event.postback.payload);
        postbackHandlerObject.handelPostback(jsonObj);
    } else {
        postbackHandlerObject.handleGetStartButtonPostback(event.postback.payload);
    }
}

function handleFacebookAttachments(event, existUser, userMappingObject) {
    var attachmentHandlerObject = attachmentHandler(existUser, userMappingObject);
    attachmentHandlerObject.handlerAttachmentsFromUser(event);
}

function handleFacebookDeliver(existUser) {
    if (util.isDefined(existUser.getResponseAPI())) {
        if (existUser.getResponseAPI().isLog === false) {
            logHandle(existUser.getSenderID(), existUser.getStatusCode(), existUser.getResponseAPI().response);
            var tempObj = existUser.getResponseAPI();
            tempObj.isLog = true;
            existUser.setResponseAPI(tempObj);
        }
    }
}