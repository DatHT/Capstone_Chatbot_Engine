var config = require('../../../../common/app-config').config;
var util = require('../../../../common/CommonUtil');

module.exports = createFulfillMessage;

function FulfillMessage(user) {
    this.user = user;
}

function createFulfillMessage(user) {
    if (!util.isDefined(user)) {
        return new Error('lack of current user');
    }
    return new FulfillMessage(user);
}

FulfillMessage.prototype.handleWordProcessingFulfillMessage = function (response) {
    return handleWordProcessingFulfillMessage(response, this.user);
};

function handleWordProcessingFulfillMessage(response, user) {
    var action = response.result.action;
    var responseText = response.result.fulfillment.speech;
    var splittedText = util.splitResponse(responseText);
    var params = response.result.parameters;

    var isLocationNearby = (params.Location_Ambiguity &&  params.Location_Ambiguity === config.LOCATION_AMBIGUITY1) ? true : false;
    var isLocationAnywhere = (params.Location_Ambiguity && params.Location_Ambiguity === config.LOCATION_AMBIGUITY2) ? true : false;
    var isLocationNormal = params.Location ? true : false;
    var isFoodAmbiguity = (params.Food_Ambiguity) ? true : false;
    var isFoodNormal = (params.Food) ? true : false;

    if (action === config.ACTION_FULL_TYPE_REQUEST) {
        util.setRemoveDataWhenChangeContext(user);
        if (splittedText.toString().trim() === config.successMessage) {
            user.setFood(params.Food);
            if (isLocationNearby) {
                user.setLocation({
                    name: config.LOCATION_AMBIGUITY1,
                    type: config.location_type.nearby
                });
                var responseText = "Bạn hãy chia sẽ địa điểm của bạn cho tôi thông qua Facebook Messenger :D";
                user.sendFBMessageTypeText(responseText);
            } else {
                var typeQuery;
                user.setLocation({
                    name: params.Location,
                    type: config.location_type.normal
                });
                if (isLocationAnywhere) {
                    user.setLocation({
                        name: config.LOCATION_AMBIGUITY2,
                        type: config.location_type.anywhere
                    });
                    typeQuery = config.QUERY_TYPE.NO_FOOD_LOCATION;
                } else if (isLocationNormal) {
                    user.setLocation({
                        name: params.Location,
                        type: config.location_type.normal
                    });
                    typeQuery = config.QUERY_TYPE.FOOD_LOCATION;
                }

                if (user.getLocation().type !== config.location_type.nearby) {
                    util.checkQueryOrCache(user, typeQuery);
                } else  {
                    util.handleQueryNearbyLocation(user, user.getLocation().name, user.getLocation().coordinate);
                }
            }
        }
    }

    if (action === config.ACTION_CHANGE_LOCATION) {
        // have all 
        if (util.isDefined(user.getFood()) && util.isDefined(user.getLocation().name)) {
            if (isLocationNearby) {
                user.setLocation({
                    name: config.LOCATION_AMBIGUITY1,
                    type: config.location_type.nearby
                });
                var responseText = "Bạn hãy chia sẽ địa điểm của bạn cho tôi thông qua Facebook Messenger :D";
                user.sendFBMessageTypeText(responseText);
            } else {
                user.setLocation({
                    name: params.Location,
                    type: config.location_type.normal
                });
                var typeQuery;
                if (isLocationAnywhere) {
                    user.setLocation({
                        name: config.LOCATION_AMBIGUITY2,
                        type: config.location_type.anywhere
                    });
                    if (user.getFood() === config.FOOD_AMBIGUITY1) {
                        typeQuery = config.QUERY_TYPE.NO_FOOD_LOCATION;
                    } else {
                        typeQuery = config.QUERY_TYPE.ONLY_FOOD;
                    }
                } else if (isLocationNormal) {
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
                } else  {
                    util.handleQueryNearbyLocation(user, user.getLocation().name, user.getLocation().coordinate);
                }
            }
        }
    }

    if (action == config.ACTION_CHANGE_FOOD) {
        // have all 
        if (util.isDefined(user.getFood()) && util.isDefined(user.getLocation().name)) {
            var typeQuery;
            // clear food
            if (isFoodNormal) {
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
            if (isFoodAmbiguity) {
                user.setFood(config.FOOD_AMBIGUITY1);
                if (user.getLocation().name === config.LOCATION_AMBIGUITY2) {
                    typeQuery = config.QUERY_TYPE.NO_FOOD_LOCATION;
                } else {
                    typeQuery = config.QUERY_TYPE.ONLY_LOCATION;
                }
            }

            if (user.getLocation().type !== config.location_type.nearby) {
                util.checkQueryOrCache(user, typeQuery);
            } else  {
                util.handleQueryNearbyLocation(user, user.getLocation().name, user.getLocation().coordinate);
            }
        }
    }
}