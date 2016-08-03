/**
 * Created by ThanhTVSE0612 on 8/1/16.
 */
var config = require('../../../../common/app-config').config;
var util = require('../../../../common/CommonUtil');

module.exports = createGetStartFoodMessage;

function GetStartFoodMessage(user) {
    this.user = user;
}

function createGetStartFoodMessage(user) {
    if (!util.isDefined(user)) {
        return new Error('lack of current user');
    }
    return new GetStartFoodMessage(user);
}

GetStartFoodMessage.prototype.handleWordProcessingGetStartFoodMessage = function (response) {
    return handleWordProcessingGetStartFoodMessage(response, this.user);
};

function handleWordProcessingGetStartFoodMessage(response, user) {
    var action = response.result.action;
    var responseText = response.result.fulfillment.speech;
    var splittedText = util.splitResponse(responseText);
    var params = response.result.parameters;


    if (action === config.ACTION_USER_COLLECT_INFORMATION) {
        if (splittedText.length > 0 && splittedText.toString().trim() === config.successMessage) {
            var foodString = '';
            if (!util.isDefined(user.getFavouriteFood())) {
                foodString += params + ',';
            } else {
                foodString = user.getFavouriteFood();
            }
            foodString += params + ',';
            user.setFavouriteFood(favouriteFood);
        }
    }
}
