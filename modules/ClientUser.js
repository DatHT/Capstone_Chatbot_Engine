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
var responseAPI;
var statusCode;
function ClientUser(session, fbID) {
    this.sessionId = session;
    this.senderID = fbID;
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
ClientUser.prototype.setResponseAPI = function (response) {
    this.responseAPI = response;
}

ClientUser.prototype.setStatusCode = function (status) {
    this.statusCode = status;
}

ClientUser.prototype.setFood = function (foodObj) {
    this.food = foodObj;
}

ClientUser.prototype.setCurrentPositionItem = function (position) {
    this.currentPositionItem = position;
}

ClientUser.prototype.setLocation = function (locationObj) {
    this.location = locationObj;
}

ClientUser.prototype.getResponseAPI = function () {
    return this.responseAPI;
}

ClientUser.prototype.getStatusCode = function () {
     return this.statusCode;
}

ClientUser.prototype.getSessionID = function () {
    return this.sessionId;
}

ClientUser.prototype.getCurrentPosition = function () {
    return this.currentPositionItem;
}

ClientUser.prototype.getSenderID = function () {
    return this.senderID;
}

ClientUser.prototype.getFood = function () {
    return this.food;
}

ClientUser.prototype.getLocation = function () {
    return this.location;
}

ClientUser.prototype.sendFBMessageTypeText = function (messageData) {
    return fbClient.sendFBMessageTypeText(this.senderID, messageData);
};

ClientUser.prototype.sendFBMessageTypeImage = function (urlString) {
    return fbClient.sendFBMessageTypeImage(this.senderID, urlString);
};

ClientUser.prototype.sendFBMessageTypeImageFile = function (urlImageFile) {
    return fbClient.sendFBMessageTypeImageFile(this.senderID,urlImageFile);
};

ClientUser.prototype.sendFBMessageTypeButtonTemplate = function (buttonArray) {
    return fbClient.sendFBMessageTypeButtonTemplate(this.senderID, buttonArray);
};

ClientUser.prototype.sendFBMessageTypeStructureMessage = function (elementArray) {
    return fbClient.sendFBMessageTypeStructureMessage(this.senderID, elementArray);
};

ClientUser.prototype.getSenderInformation = function (callback) {
    fbClient.getSenderInformation(this.senderID, function (response) {
        return callback(response);
    });
}