var config = require('../../common/app-config').config;
var util = require('../../common/CommonUtil');
var logHandle = require('../LogHandler/Logger');
var googleMapAPI = require('../../lib/GoogleAPI/GoogleMapAPI');
var fs = require('fs');
var path = require('path');

function UnknownMessage(user, userMapping) {
    this.user = user;
    this.userMappingObj = userMapping;
}

function createUnknownMessage(user, userMapping) {
    if (!util.isDefined(user)) {
        return new Error('lack of current user');
    }
    return new UnknownMessage(user, userMapping);
}

UnknownMessage.prototype.handleUnknownMessage = function (response) {
    return handleUnknownMessage(response, this.user, this.userMappingObj);
}

function handleUnknownMessage(response, user, userMappingObject) {
    var action = response.result.action;
    var responseText = response.result.fulfillment.speech;
    var splittedText = util.splitResponse(responseText);

    var resolveQuery = response.result.resolvedQuery.trim().toLowerCase();
    var prefixString = resolveQuery.slice(0,6);
    if (prefixString === 'train:') {
        logHandle(user.getSenderID(), 202, response);
        var responseText = 'Cảm ơn sự giúp đỡ của bạn để khiến bot thông minh hơn! Chúng tôi sẽ ghi nhận và xử lý sớm :D';
        user.sendFBMessageTypeText(responseText);
        userMappingObject.delete(user.getSenderID());
        return;
    }

    prefixString = resolveQuery.slice(0, 4);
    if (prefixString === 'map:') {
        if (util.isDefined(user.getCurrentData())) {
            var position = parseInt(resolveQuery.slice(4).trim());
            var currentDataItem = user.getCurrentData()[position];
            googleMapAPI.getStaticGoogleMap(currentDataItem.latitude, currentDataItem.longitude, (response, error) => {
                createStaticGoogleMap(response, user, (result) => {
                    if (result.status === 100) {
                        user.sendFBMessageTypeImage(config.HOST.hostname + '/temp/' + user.getSenderID() + '.png');
                    }
                });
            });
            return;
        }
    }

    prefixString = resolveQuery.slice(0,5);
    if (prefixString === 'next:') {
        if (util.isDefined(user.getCurrentData())) {
            var position = parseInt(resolveQuery.slice(4).trim());
            var currentDataItem = user.getCurrentData()[position];

            return;
        }
    }

    if (action === config.ACTION_UNKNOWN) {
        if (splittedText.length > 0 && splittedText.toString().trim() !== config.successMessage) {
            for (var i = 0; i < splittedText.length; i++) {
                user.sendFBMessageTypeText(splittedText[i]);
            }
        }
    }
}

function createStaticGoogleMap(base64Data, user, callback) {
    var folderPath = require('app-root-path').resolve('public/temp');
    fs.exists(folderPath, function (result) {
        if (result) {
            createImage();
        } else {
            fs.mkdir(folderPath, createImage());
        }
        console.log('create folder success');
    });

    function createImage() {
        var imageName = folderPath + '/' + user.getSenderID() + '.png';
        fs.exists(imageName, function (result) {
            // if (!result) {
                fs.writeFile(imageName, base64Data, {encoding: 'binary'}, function (err) {
                    if (!err) {
                        console.log('create image success');
                        return callback({
                            status : 100
                        });
                    } else {
                        console.log(err);
                    }
                });
            // }
        });
    }
}

module.exports = createUnknownMessage;