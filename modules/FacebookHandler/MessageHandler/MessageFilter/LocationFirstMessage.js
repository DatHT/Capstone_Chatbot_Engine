var config = require('../../../../common/app-config').config;
var util = require('../../../../common/CommonUtil');

module.exports = createLocationFirstMessage;

function LocationFirstMessage(user) {
    this.user = user;
}

function createLocationFirstMessage(user) {
    if (!util.isDefined(user)) {
        return new Error('lack of current user');
    }
    return new LocationFirstMessage(user);
}

LocationFirstMessage.prototype.handleWordProcessingLocationFirst = function (response) {
    return handleWordProcessingLocationFirst(response, this.user);
}

function handleWordProcessingLocationFirst(response, user) {
    var action = response.result.action;
    var responseText = response.result.fulfillment.speech;
    var splittedText = util.splitResponse(responseText);
    var params = response.result.parameters;
    if (action === config.ACTION_FIND_LOCATION) {
        var params = response.result.parameters;
        user.setLocation({
            name: params.Location,
            type: config.location_type.normal
        });
        if (splittedText.length > 0 && splittedText.toString().trim() !== config.successMessage) {
            var responseText = 'Bạn thích thưởng thức món gì nào :D';
            var elementArray = util.createItemOfStructureButton(config.ASK_FOOD_BUTTON);
            user.sendFBMessageTypeButtonTemplate(elementArray, responseText);
        }
    }

    if (action === config.ACTION_FIND_FOOD) {
        if (splittedText.toString().trim() === config.successMessage) {
            user.setFood(params.Food);
            util.checkQueryOrCache(user, config.QUERY_TYPE.FOOD_LOCATION);
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
            } else  {
                util.handleQueryNearbyLocation(user, user.getLocation().name, user.getLocation().coordinate);
            }
        }
    }

    if (action == config.ACTION_CHANGE_LOCATION) {
        //have all
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
                } else  {
                    util.handleQueryNearbyLocation(user, user.getLocation().name, user.getLocation().coordinate);
                }
            }
        }

        // have location - do not have foodFOOD
        if (!util.isDefined(user.getFood()) && util.isDefined(user.getLocation())) {
            user.setLocation({
                name: params.Location,
                type: config.location_type.normal
            });
            var responseText = "Vâng bạn đổi sang " + user.getLocation().name.trim() + "! Bạn muốn ăn g?";
            var elementArray = util.createItemOfStructureButton(config.ASK_FOOD_BUTTON, user);
            user.sendFBMessageTypeButtonTemplate(elementArray, responseText);
        }
    }
}