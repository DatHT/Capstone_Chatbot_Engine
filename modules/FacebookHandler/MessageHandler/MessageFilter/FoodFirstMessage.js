var config = require('../../../../common/app-config').config;
var util = require('../../../../common/CommonUtil');
var dbConnection = require('../../../DBManager/Database');
var apiai = require('apiai');
var app_apiai = apiai(config.API_AI.DEV_ACCESS_TOKEN);

module.exports = createFoodFirstMessage;

function FoodFirstMessage(user) {
    this.user = user;
}

function createFoodFirstMessage(user) {
    if (!util.isDefined(user)) {
        return new Error('lack of current user');
    }
    return new FoodFirstMessage(user);
}

FoodFirstMessage.prototype.handleWordProcessingFoodFirst = function (response) {
    return handleWordProcessingFoodFirst(response, this.user);
};

function handleWordProcessingFoodFirst(response, user) {
    var action = response.result.action;
    var responseText = response.result.fulfillment.speech;
    var splittedText = util.splitResponse(responseText);
    var params = response.result.parameters;

    if (action === config.ACTION_FIND_FOOD) {
        user.setFood(params.Food);
        checkFoodExisted(user,  splittedText);
    }

    if (action === config.ACTION_FIND_LOCATION) {
        if (splittedText.toString().trim() === config.successMessage) {
            user.setLocation({
                name: params.Location,
                type: config.location_type.nomal
            });
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
                var tmp;
                util.getProductNearbyLocation(user.getLocation().coordinate, user, tmp);
            }
        }

        // have food - do not have location
        if (util.isDefined(user.getFood()) && !util.isDefined(user.getLocation())) {
            user.setFood(params.Food);
            // var elementArray = util.createItemOfStructureButton(config.ASK_LOCATION_BUTTON, user);
            // var responseText = "Bạn muốn ăn ở đâu?";
            // user.sendFBMessageTypeButtonTemplate(elementArray, responseText);

            checkFoodExisted(user, splittedText);
        }
    }

    if (action == config.ACTION_CHANGE_LOCATION) {
        if (util.isDefined(user.getFood()) && util.isDefined(user.getLocation().name)) {
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
                    var tmp;
                    util.getProductNearbyLocation(user.getLocation().coordinate, user, tmp);
                }
            }
        }
    }
}

function checkFoodExisted(user, splittedText) {
    dbConnection.checkoFoodExisted(user.getFood(), (rows, err) => {
        if (rows.length === 0) {
            var responseText = 'Theo như tôi biết thì hiện tại món này không có';
            user.sendFBMessageTypeText(responseText);
        } else if (rows.length <= 10) {
            var responseText = 'Theo như tôi biết thì hiện tại chỉ có những địa điểm này có thôi';
            var elementArray = [];
            var currentDataArray = [];

            var lengthArray = rows.length >= 10 ? 10 : rows.length;
            user.setCurrentPositionItem(lengthArray);
            for (var i = 0; i < lengthArray; i++) {
                currentDataArray[i] = rows[i];
                var structureObj = util.createItemOfStructureResponseForProduct(rows[i]);
                elementArray.push(structureObj);
            }
            user.setCurrentData(currentDataArray);
            user.sendFBMessageTypeStructureMessage(elementArray);

            var opt = {
                sessionId: user.getSessionID()
            };
            sendDummyRequestToApi(config.LOCATION_AMBIGUITY2, opt, function (response) {
                user.setStatusCode(200);
                user.setResponseAPI(response);
                console.log("send dummy request successfully");
            });
        } else  {
            if (splittedText.length > 0 && splittedText.toString().trim() !== config.successMessage) {
                for (var i = 0; i < splittedText.length; i++) {
                    var elementArray = util.createItemOfStructureButton(config.ASK_LOCATION_BUTTON)
                    var responseText = 'Bạn có thể cho tôi biết địa điểm bạn muốn ăn dc không :D'
                    user.sendFBMessageTypeButtonTemplate(elementArray, responseText);
                }
            }
        }


    });
}

// request dummy request api
function sendDummyRequestToApi(statements, option, callback) {
    var request = app_apiai.textRequest(statements, option);

    request.on('response', function (response) {
        return callback(response)
    });

    request.on('error', function (error) {
        console.log(error);
    });

    request.end();
}