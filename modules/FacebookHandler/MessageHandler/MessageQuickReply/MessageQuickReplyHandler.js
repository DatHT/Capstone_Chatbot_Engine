/**
 * Created by ThanhTVSE0612 on 8/1/16.
 */
var config = require('../../../../common/app-config').config;
var util = require('../../../../common/CommonUtil');

const QUICK_REPLY_GET_START = 'get_start';

module.exports = createQuickReplyMessageHandler;

function QuickReplyMessageHandler(user, userMappingObject) {
    this.user = user;
    this.userMappingObj = userMappingObject || {};
}

function createQuickReplyMessageHandler(user, userMappingObject) {
    if (!util.isDefined(user)) {
        return new Error('Lack of user ');
    }

    if (!util.isDefined(userMappingObject)) {
        return new Error('Lack of userMappingObject ');
    }

    return new QuickReplyMessageHandler(user, userMappingObject);
}

QuickReplyMessageHandler.prototype.handleQuickReplyMessage = function (response) {
    return handleQuickReplyMessage(response, this.user, this.userMappingObj);
};

function handleQuickReplyMessage(response, user, userMappingObject) {
    if (response.type === QUICK_REPLY_GET_START) {
        user.setUserLocation(response.payload.district);
        var responseText = 'Xin hãy nhập 1 món ăn bạn yêu thích :D';
        user.sendFBMessageTypeText(responseText);
    }
}