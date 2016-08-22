/**
 * Created by ThanhTV0612 on 6/29/16.
 */
'use strict';
var config = require('../../../common/app-config').config;
var util = require('../../../common/CommonUtil');

module.exports = createAttachmentsHandler;

function AttachmentsHandler(user, userMapping) {
    this.user = user;
    this.userMappingObj = userMapping;
}

function createAttachmentsHandler(user, userMapping) {
    if (!util.isDefined(user)) {
        return new Error('lack of current user');
    }
    return new AttachmentsHandler(user, userMapping);
}

AttachmentsHandler.prototype.handlerAttachmentsFromUser = function (event) {
    return handlerAttachmentsFromUser(event, this.user, this.userMappingObj);
};

function handlerAttachmentsFromUser(event, user, userMappingObject) {
    var type = event.message.attachments[0].type;
    if (type === "location" && util.isDefined(user.getLocation()) ) {
            if (user.getLocation().name === config.LOCATION_AMBIGUITY1) {
                var url = event.message.attachments[0].url;
                var param = util.getURLParam("where1", decodeURIComponent(url));
                var location = param.split("%2C");
                location[0] = parseFloat(location[0]);
                location[1] = parseFloat(location[1]);

                var tmp;
                util.getProductNearbyLocation(location, user, tmp);
            }
    } else {
        var responseText = "Xin lỗi hiện tại bot vẫn chưa thể xử lý yêu cầu của bạn\nBạn hãy 1 câu để tìm món ăn\nVD: tìm mì quảng :D";
        user.sendFBMessageTypeText(responseText);
    }
}







