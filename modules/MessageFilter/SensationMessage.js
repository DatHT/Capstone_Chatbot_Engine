var config = require('../../common/app-config').config;
var util = require('../../common/CommonUtil');

module.exports = createSensationMessage;

function SensationMessage(user) {
    this.user = user;
}

function createSensationMessage(user) {
    if (!util.isDefined(user)) {
        return new Error('lack of current user');
    }
    return new SensationMessage(user);
}

SensationMessage.prototype.handleWordProcessingSensationMessage = function (response) {
    return handleWordProcessingSensationMessage(response, this.user);
}

function handleWordProcessingSensationMessage(response, user) {
    var action = response.result.action;
    var responseText = response.result.fulfillment.speech;
    var splittedText = util.splitResponse(responseText);
    var params = response.result.parameters;
    if (action === config.ACTION_SENSATION_STATEMENT) {
        if (splittedText.length > 0 && splittedText.toString().trim() !== config.successMessage) {
            for (var i = 0; i < splittedText.length; i++) {
                var elementArray = [{
                    type: "postback",
                    title: "Ừ thì ăn!",
                    payload: JSON.stringify({type: "sensation", isYes: "yes"})
                }, {
                    type: "postback",
                    title: "Thôi không ăn đâu!",
                    payload: JSON.stringify({
                        type: "cancel"
                    })
                }];
                user.sendFBMessageTypeButtonTemplate(elementArray, splittedText[i]);
            }
        }
    }

    if (action === config.ACTION_CHANGE_LOCATION) {
        // have all 
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

        if (!util.isDefined(user.getLocation())) {
            user.setLocation({
                name: params.Location,
                type: config.location_type.normal
            });
            util.checkQueryOrCache(user, config.QUERY_TYPE.ONLY_LOCATION);
        }
    }

    if (action === config.ACTION_SENSATION_STATEMENT_REQUEST_CHOOSE_BUTTON) {
        if (splittedText.length > 0 && splittedText.toString().trim() !== config.successMessage) {
            for (var i = 0; i < splittedText.length; i++) {
                user.sendFBMessageTypeText(splittedText[i]);
            }
        }
    }

    if (action === config.ACTION_CHANGE_FOOD) {
        if (!util.isDefined(user.getLocation())) {
            user.setFood(params.Food);
            var elementArray = [{
                type: "postback",
                title: "Chỗ nào gần đây thôi!",
                payload: JSON.stringify({type: "sensation", locationType: config.LOCATION_AMBIGUITY1})
            }, {
                type: "postback",
                title: "Chỗ nào ngon là đi!",
                payload: JSON.stringify({type: "sensation", locationType: config.LOCATION_AMBIGUITY2})
            }, {
                type: "postback",
                title: "Đê tôi chọn chỗ!",
                payload: JSON.stringify({type: "sensation", locationType: 'my_location'})
            }];
            var responseText = 'Vậy bạn muốn ăn ở gần đây hay ăn đâu cũng được nhỉ :D';
            user.sendFBMessageTypeButtonTemplate(elementArray, responseText);
        } else if (util.isDefined(user.getFood()) && util.isDefined(user.getLocation())) {
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
}