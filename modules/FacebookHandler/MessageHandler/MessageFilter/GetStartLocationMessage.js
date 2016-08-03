/**
 * Created by ThanhTVSE0612 on 8/1/16.
 */
var config = require('../../../../common/app-config').config;
var util = require('../../../../common/CommonUtil');

module.exports = createGetStartLocationMessage;

function GetStartLocationMessage(user) {
    this.user = user;
}

function createGetStartLocationMessage(user) {
    if (!util.isDefined(user)) {
        return new Error('lack of current user');
    }
    return new GetStartLocationMessage(user);
}

GetStartLocationMessage.prototype.handleWordProcessingGetStartLocationMessage = function (response) {
    return handleWordProcessingGetStartLocationMessage(response, this.user);
};

function handleWordProcessingGetStartLocationMessage(response, user) {
    var action = response.result.action;
    var responseText = response.result.fulfillment.speech;
    var splittedText = util.splitResponse(responseText);

    if (action === config.ACTION_USER_COLLECT_INFORMATION) {
        if (splittedText.length > 0 && splittedText.toString().trim() === config.successMessage) {
            var responseText = 'Xin hãy nhập 1 món ăn bạn yêu thích nhất :D';
            user.sendFBMessageTypeText(responseText);
        }
    }
}

