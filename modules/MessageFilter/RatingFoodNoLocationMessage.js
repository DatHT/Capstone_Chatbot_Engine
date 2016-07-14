var config = require('../../common/app-config').config;
var util = require('../../common/CommonUtil');

module.exports = createRatingFoodNoLocationMessageUser;

function RatingFoodNoLocationMessage(user) {
    this.user = user;
}

function createRatingFoodNoLocationMessageUser(user) {
    if (!util.isDefined(user)) {
        return new Error('lack of current user');
    }
    return new RatingFoodNoLocationMessage(user);
}

RatingFoodNoLocationMessage.prototype.handleWordProcessingRatingFoodNoLocation = function (response) {
    return handleWordProcessingRatingFoodNoLocation(response, this.user);
}

function handleWordProcessingRatingFoodNoLocation(response, user) {
    var action = response.result.action;
    var responseText = response.result.fulfillment.speech;
    var splittedText = util.splitResponse(responseText);
    var params = response.result.parameters;

    if (action === config.ACTION_RATING_REQUEST_FOOD_NO_LOCATION) {
        user.setFood(config.FOOD_AMBIGUITY1);
        for (var i = 0; i < splittedText.length; i++) {
            var elementArray = [{
                type: "postback",
                title: "Có",
                payload: JSON.stringify({
                    type: "yes_no",
                    isYes: "yes"
                })
            }, {
                type: "postback",
                title: "Không",
                payload: JSON.stringify({
                    type: "yes_no",
                    isYes: "no"
                })
            }];
            user.sendFBMessageTypeButtonTemplate(elementArray, splittedText[i]);
        }
    }

    if (action === config.ACTION_CHANGE_FOOD) {
        // have all
        if (util.isDefined(user.getFood()) && util.isDefined(user.getLocation())) {
            var typeQuery;
            // clear food
            if (params.Food) {
                user.setFood(params.Food);
                if (user.getLocation().name === config.LOCATION_AMBIGUITY2) {
                    typeQuery = config.QUERY_TYPE.ONLY_FOOD;
                } else {
                    typeQuery = config.QUERY_TYPE.FOOD_LOCATION;
                    if (user.getLocation().name === config.LOCATION_AMBIGUITY2) {
                        typeQuery = config.QUERY_TYPE.NO_FOOD_LOCATION;
                    }
                }
            }

            // an gi cung dc
            if (params.Food_Ambiguity) {
                user.setFood(config.FOOD_AMBIGUITY1);
                if (user.getLocation().name === config.LOCATION_AMBIGUITY2) {
                    typeQuery = config.QUERY_TYPE.NO_FOOD_LOCATION;
                } else {
                    typeQuery = config.QUERY_TYPE.ONLY_LOCATION;
                }
            }

            if (user.getLocation().type !== config.location_type.nearby) {
                util.checkQueryOrCache(user, typeQuery);
            } else {
                util.handleQueryNearbyLocation(user, user.getLocation().name, user.getLocation().coordinate);
            }
        }
    }

    if (action == config.ACTION_CHANGE_LOCATION) {
        if (util.isDefined(user.getFood()) && util.isDefined(user.getLocation())) {
            if (params.Location_Ambiguity && params.Location_Ambiguity === config.LOCATION_AMBIGUITY1) {
                user.setLocation({
                    name: config.LOCATION_AMBIGUITY1,
                    type: config.location_type.nearby
                });
                var responseText = "Bạn hãy chia sẽ địa điểm của bạn cho tôi thông qua Facebook Messenger :D";
                user.sendFBMessageTypeText(responseText);
            } else {
                var typeQuery;
                if (params.Location_Ambiguity && params.Location_Ambiguity === config.LOCATION_AMBIGUITY2) {
                    user.setLocation({
                        name: config.LOCATION_AMBIGUITY2,
                        type: config.location_type.anywhere
                    });
                    if (user.getFood() === config.FOOD_AMBIGUITY1) {
                        typeQuery = config.QUERY_TYPE.NO_FOOD_LOCATION;
                    } else {
                        typeQuery = config.QUERY_TYPE.ONLY_FOOD;
                    }
                } else if (params.Location) {
                    user.setLocation({
                        name: params.Location,
                        type: config.location_type.normal
                    });
                    if (user.getFood() === config.FOOD_AMBIGUITY1) {
                        typeQuery = config.QUERY_TYPE.ONLY_LOCATION;
                    } else {
                        typeQuery = config.QUERY_TYPE.FOOD_LOCATION;
                    }
                }

                if (user.getLocation().type !== config.location_type.nearby) {
                    util.checkQueryOrCache(user, typeQuery);
                } else {
                    util.handleQueryNearbyLocation(user, user.getLocation().name, user.getLocation().coordinate);
                }
            }
        }
    }
}