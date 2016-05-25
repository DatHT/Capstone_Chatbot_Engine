/**
 * Created by ThanhTV0612 on 5/25/16.
 */
var config = require('../common/app-config').config;
const fbAPIRequest = require('./FacebookAPI').FacebookAPI;
const FB_PAGE_ACCESS_TOKEN = config.FACEBOOK_TOKEN.FB_PAGE_ACCESS_TOKEN;
const fbClient = new fbAPIRequest(FB_PAGE_ACCESS_TOKEN);

var sessionId;
var senderID;

function ClientUser(session, fbID) {
    sessionID = session;
    senderID = fbID;
}

function createClientUser(session, fbID) {
    if (session.length === 0) {
        return new Error("session empty");
    }

    if (fbID.length === 0) {
        return new Error("sender ID empty");
    }

    return new ClientUser(session, fbID);
}

module.exports = createClientUser;
ClientUser.prototype.getSessionID = function () {
    return sessionId;
}

ClientUser.prototype.getSenderID = function () {
    return senderID;
}

ClientUser.prototype.sendFBMessageTypeText = function (messageData) {
    return fbClient.sendFBMessageTypeText(senderID, messageData);
};

ClientUser.prototype.sendFBMessageTypeImage = function (urlString) {
    return fbClient.sendFBMessageTypeImage(senderID, urlString);
};

ClientUser.prototype.sendFBMessageTypeImageFile = function (urlImageFile) {
    return fbClient.sendFBMessageTypeImageFile(senderID,urlImageFile);
};

ClientUser.prototype.sendFBMessageTypeButtonTemplate = function (buttonArray) {
    return fbClient.sendFBMessageTypeButtonTemplate(senderID, buttonArray);
};

ClientUser.prototype.sendFBMessageTypeStructureMessage = function (elementArray) {
    return fbClient.sendFBMessageTypeStructureMessage(senderID, elementArray);
};