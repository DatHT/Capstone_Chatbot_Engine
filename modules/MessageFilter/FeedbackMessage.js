/**
 * Created by ThanhTV0612 on 6/29/16.
 */

var config = require('../../common/app-config').config;
var util = require('../../common/CommonUtil');
var logHandle = require('../Logger');

module.exports = createFeedbackMessage;

function FeedbackMessage(user, userMapping) {
    this.user = user;
    this.userMappingObj = userMapping;
}

function createFeedbackMessage(user, userMapping) {
    if (!util.isDefined(user)) {
        return new Error('lack of current user');
    }
    return new FeedbackMessage(user, userMapping);
}

FeedbackMessage.prototype.handleWordProcessingFeedbackMessage = function (response) {
    return handleWordProcessingFeedbackMessage(response, this.user, this.userMappingObj);
}

function handleWordProcessingFeedbackMessage(response, user, userMappingObject) {
    var action = response.result.action;
    var responseText = response.result.fulfillment.speech;
    var splittedText = util.splitResponse(responseText);

    if (action === config.ACTION_FEEDBACK) {
        if (splittedText.length > 0 && splittedText.toString().trim() === config.successMessage) {
            logHandle(user.getSenderID(), 609, response);
            var responseText = 'Cảm ơn những phản hồi có của bạn! Chúng tôi sẽ làm việc chăm chỉ để Bot thêm thông minh hơn nữa :D';
            user.sendFBMessageTypeText(responseText);
            userMappingObject.delete(user.getSenderID());
        }
    }
}

