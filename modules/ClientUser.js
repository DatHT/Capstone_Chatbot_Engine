/**
 * Created by ThanhTV0612 on 5/25/16.
 */
var config = require('../common/app-config').config;
const fbAPIRequest = require('./FacebookAPI').FacebookAPI;
const FB_PAGE_ACCESS_TOKEN = config.FACEBOOK_TOKEN.FB_PAGE_ACCESS_TOKEN;
const fbClient = new fbAPIRequest(FB_PAGE_ACCESS_TOKEN);

var sessionId;
var senderID;
var food;
var location;
var currentPositionItem;
function ClientUser(session, fbID) {
    sessionId = session;
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
ClientUser.prototype.setFood = function (foodObj) {
    food = foodObj;
}

ClientUser.prototype.setCurrentPositionItem = function (position) {
    currentPositionItem = position;
}

ClientUser.prototype.setLocation = function (locationObj) {
    location = locationObj;
}

ClientUser.prototype.getSessionID = function () {
    return sessionId;
}

ClientUser.prototype.getCurrentPosition = function () {
    return currentPositionItem;
}

ClientUser.prototype.getSenderID = function () {
    return senderID;
}

ClientUser.prototype.getFood = function () {
    return food;
}

ClientUser.prototype.getLocation = function () {
    return location;
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