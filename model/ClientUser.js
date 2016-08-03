/**
 * Created by ThanhTV0612 on 5/25/16.
 */

var config = require('../common/app-config').config;
var FB_PAGE_ACCESS_TOKEN = config.FACEBOOK_TOKEN.FB_PAGE_ACCESS_TOKEN;
var fbAPIRequest = require('./../common/FacebookAPI').FacebookAPI;
var fbClient = new fbAPIRequest(FB_PAGE_ACCESS_TOKEN);

var sessionId;
var senderID;
var food;
var location;
var currentPositionItem;
var responseAPI;
var statusCode;
var data;
var currentData;

//user information
var userLocation;
var firstname;
var lastname;
var gender;
var locale;
var favouriteFood;
var favouriteRestaurant;

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

ClientUser.prototype.setCurrentData = function (currentData) {
    this.currentData = currentData
};

ClientUser.prototype.setData = function (data) {
    this.data = data;
};

ClientUser.prototype.setResponseAPI = function (response) {
    this.responseAPI = response;
};

ClientUser.prototype.setStatusCode = function (status) {
    this.statusCode = status;
};

ClientUser.prototype.setFood = function (foodObj) {
    this.food = foodObj;
};

ClientUser.prototype.setCurrentPositionItem = function (position) {
    this.currentPositionItem = position;
};

ClientUser.prototype.setLocation = function (locationObj) {
    this.location = locationObj;
};

ClientUser.prototype.setFirstname = function (firstName) {
    this.firstname = firstName;
};

ClientUser.prototype.setLastname = function (lastName) {
    this.lastname = lastName;
};

ClientUser.prototype.setLocale = function (locale) {
    this.locale = locale;
};

ClientUser.prototype.setFavouriteFood = function (favouriteFood) {
    this.favouriteFood = favouriteFood;
};

ClientUser.prototype.setFavouriteRestaurant = function (restaurant) {
    this.FavouriteRestaurant = restaurant;
};

ClientUser.prototype.setGender = function (gender) {
    this.gender = gender;
};

ClientUser.prototype.setUserLocation = function (userLocation) {
    this.userLocation = userLocation;
};

ClientUser.prototype.getUserLocation = function () {
    return this.userLocation;
};

ClientUser.prototype.getFavouriteFood = function () {
    return this.favouriteFood;
};

ClientUser.prototype.getFavouriteRestaurant = function () {
    return this.FavouriteRestaurant;
};

ClientUser.prototype.getGender = function () {
    return this.gender;
};

ClientUser.prototype.getFirstname = function () {
    return this.firstname;
};

ClientUser.prototype.getLastname = function () {
    return this.lastname;
};

ClientUser.prototype.getLocale = function () {
    return this.locale;
};

ClientUser.prototype.getResponseAPI = function () {
    return this.responseAPI;
};

ClientUser.prototype.getData = function () {
    return this.data;
};

ClientUser.prototype.getStatusCode = function () {
     return this.statusCode;
};

ClientUser.prototype.getSessionID = function () {
    return this.sessionId;
};

ClientUser.prototype.getCurrentPosition = function () {
    return this.currentPositionItem;
};

ClientUser.prototype.getSenderID = function () {
    return this.senderID;
};

ClientUser.prototype.getFood = function () {
    return this.food;
};

ClientUser.prototype.getLocation = function () {
    return this.location;
};

ClientUser.prototype.getCurrentData = function () {
    return this.currentData;
};

ClientUser.prototype.sendFBMessageTypeText = function (messageData) {
    return fbClient.sendFBMessageTypeText(this.senderID, messageData);
};

ClientUser.prototype.sendFBMessageTypeImage = function (urlString) {
    return fbClient.sendFBMessageTypeImage(this.senderID, urlString);
};

ClientUser.prototype.sendFBMessageTypeImageFile = function (urlImageFile) {
    return fbClient.sendFBMessageTypeImageFile(this.senderID,urlImageFile);
};

ClientUser.prototype.sendFBMessageTypeButtonTemplate = function (buttonArray, responseText) {
    return fbClient.sendFBMessageTypeButtonTemplate(this.senderID, buttonArray, responseText);
};

ClientUser.prototype.sendFBMessageTypeStructureMessage = function (elementArray) {
    return fbClient.sendFBMessageTypeStructureMessage(this.senderID, elementArray);
};

ClientUser.prototype.sendFBMessageTypeStructureMessageIncludeMessage = function (elementArray, responseText) {
    return fbClient.sendFBMessageTypeStructureMessageIncludeMessage(this.senderID, elementArray, responseText);
};

ClientUser.prototype.getSenderInformation = function (callback) {
    fbClient.getSenderInformation(this.senderID, function (response) {
        return callback(response);
    });
};

ClientUser.prototype.sendFBQuickReplyMessage = function (quickReplyArray, responseText) {
    return fbClient.sendFBQuickReplyMessage(this.senderID , quickReplyArray, responseText);
};


