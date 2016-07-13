var config = require('../../common/app-config').config;
var util = require('../../common/CommonUtil');
var logHandle = require('../LogHandler/Logger');

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

    if (action === config.ACTION_UNKNOWN) {
        if (splittedText.length > 0 && splittedText.toString().trim() !== config.successMessage) {
            for (var i = 0; i < splittedText.length; i++) {
                user.sendFBMessageTypeText(splittedText[i]);
            }
        }
    }
}

module.exports = createUnknownMessage;