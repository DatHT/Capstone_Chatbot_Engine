var config = require('../../../common/app-config').config;
var util = require('../../../common/CommonUtil');
var greetingMessageFilter = require('./MessageFilter/GreetingMessage');
var foodFirstMessageFilter = require('./MessageFilter/FoodFirstMessage');
var unknownMessageFilter = require('./MessageFilter/UnknownMessage');
var locationFirstMessageFilter = require('./MessageFilter/LocationFirstMessage');
var fulfillMessageFilter = require('./MessageFilter/FulfillMessage');
var sensationMessageFilter = require('./MessageFilter/SensationMessage');
var ratingFoodInLocationMessageFilter = require('./MessageFilter/RatingFoodInLocationMessage');
var ratingFoodNoLocationMessageFilter = require('./MessageFilter/RatingFoodNoLocationMessage');
var ratingLocationMessageFilter = require('./MessageFilter/RatingLocationMessage');
var feedbackMessageFilter = require('./MessageFilter/FeedbackMessage');
var getStartFoodMessageFilter = require('./MessageFilter/GetStartFoodMessage');
var getStartLocationMessageFilter = require('./MessageFilter/GetStartLocationMessage');

module.exports = createMessageHandler;

function MessagekHandler(user, userMappingObject) {
    this.user = user;
    this.userMappingObj = userMappingObject || {};
}

function createMessageHandler(user, userMappingObject) {
    if (!util.isDefined(user)) {
        return new Error('Lack of user ');
    }

    if (!util.isDefined(userMappingObject)) {
        return new Error('Lack of userMappingObject ');
    }

    return new MessagekHandler(user, userMappingObject);
}

MessagekHandler.prototype.doDispatchingMessage = function (response) {
    return doDispathchingMesssage(response, this.user, this.userMappingObj);
};

function doDispathchingMesssage(response, user, userMappingObject) {
    var consoleObject = {
        timestamp : response.timestamp,
        resolvedQuery : response.result.resolvedQuery,
        parameters : response.result.parameters,
        intentName : response.result.metadata.intentName,
        action : response.result.action
    };
    console.log(consoleObject);
    user.setResponseAPI({
        isLog : false,
        response: response
    });
    var intentName = response.result.metadata.intentName;
    if (response.status.code === 200) {

        if (intentName.indexOf(config.INPUT_INTENT_GREETING) > -1) {
            user.setStatusCode(200);
            return greetingMessageFilter.getCurrentSenderInformation(user);
        }

        if (intentName.indexOf(config.INPUT_INTENT_FOOD_FIRST) > -1) {
            user.setStatusCode(200);
            var foodFirstMessageFiterObject = foodFirstMessageFilter(user);
            return foodFirstMessageFiterObject.handleWordProcessingFoodFirst(response);
        }

        if (intentName.indexOf(config.INPUT_INTENT_UNKNOWN) > -1) {
            user.setStatusCode(300);
            var unknownMessageFilterObject = unknownMessageFilter(user, userMappingObject);
            return unknownMessageFilterObject.handleUnknownMessage(response);
        }

        if (intentName.indexOf(config.INPUT_INTENT_LOCATION_FIRST) > -1) {
            user.setStatusCode(200);
            var unknownMessageFilterObject = locationFirstMessageFilter(user);
            return unknownMessageFilterObject.handleWordProcessingLocationFirst(response);
        }

        if (intentName.indexOf(config.INPUT_INTENT_FULL_TYPE_REQUEST) > -1) {
            user.setStatusCode(200);
            var fulfillMessageFilterObject = fulfillMessageFilter(user);
            return fulfillMessageFilterObject.handleWordProcessingFulfillMessage(response);
        }

        if (intentName.indexOf(config.INPUT_INTENT_SENSATION_STATEMENT)>-1) {
            user.setStatusCode(200);
            var sensationMessageFilterObject = sensationMessageFilter(user);
            return sensationMessageFilterObject.handleWordProcessingSensationMessage(response);
        }

        if (intentName.indexOf(config.INPUT_INTENT_RATING_REQUEST_FOOD_IN_LOCATION)>-1) {
            user.setStatusCode(200);
            var ratingFoodInLocationFilterObject = ratingFoodInLocationMessageFilter(user);
            return ratingFoodInLocationFilterObject.handleWordProcessingRatingFoodInLocation(response);
        }

        if (intentName.indexOf(config.INPUT_INTENT_RATING_REQUEST_FOOD_NO_LOCATION)>-1) {
            user.setStatusCode(200);
            var ratingFoodNoLocationFilterObject = ratingFoodNoLocationMessageFilter(user);
            return ratingFoodNoLocationFilterObject.handleWordProcessingRatingFoodNoLocation(response);
        }

        if (intentName.indexOf(config.INPUT_INTENT_RATING_REQUEST_LOCATION)>-1) {
            user.setStatusCode(200);
            var ratingLocationMessageFilterObject = ratingLocationMessageFilter(user);
            return ratingLocationMessageFilterObject.handleWordPrcccessingRatingRequestLocationStatement(response);
        }

        if (intentName.indexOf(config.INPUT_INTENT_FEEDBACK)>-1) {
            user.setStatusCode(609);
            var feedbackMessageFilterObject = feedbackMessageFilter(user, userMappingObject);
            return feedbackMessageFilterObject.handleWordProcessingFeedbackMessage(response);
        }

        if (intentName.indexOf(config.INPUT_INTENT_GET_START_FOOD)>-1) {
            user.setStatusCode(200);
            var getStartFoodMessageFilterObject = getStartFoodMessageFilter(user);
            return getStartFoodMessageFilterObject.handleWordProcessingGetStartFoodMessage(response);
        }

        if (intentName.indexOf(config.INPUT_INTENT_GET_START_LOCATION)>-1) {
            user.setStatusCode(200);
            var getStartLocationMessageFilterObject = getStartLocationMessageFilter(user, userMappingObject);
            return getStartLocationMessageFilterObject.handleWordProcessingGetStartLocationMessage(response);
        }

    }
}
