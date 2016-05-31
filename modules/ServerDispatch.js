/**
 * Created by ThanhTV0612 on 5/17/16.
 */
'use strict'

var apiai = require('apiai');
var uuid = require('node-uuid');
var config = require('../common/app-config').config;

var clientUser = require('./ClientUser');
var fbAPIRequest = require('./FacebookAPI').FacebookAPI;
var databaseConnection = require('./Database');
var util = require('../common/CommonUtil');

const ACTION_FIND_FOOD = "find.food";
const ACTION_FIND_LOCATION = "find.location";
const ACTION_CHANGE_FOOD = "change.food";
const ACTION_UNKNOWN = "unknown";
const ACTION_CHANGE_LOCATION = "change.location";
const ACTION_RATING_REQUEST_FOOD_IN_LOCATION = "rating.request.food.in.location";
const ACTION_RATING_REQUEST_FOOD_NO_LOCATION = "rating.request.food.no.location";
const ACTION_RATING_REQUEST_FOOD_NO_LOCATION_ACCEPT = "rating.request.food.no.location.accept";
const ACTION_RATING_REQUEST_FOOD_NO_LOCATION_NOT_ACCEPT = "rating.request.food.no.location.not.accept";
const ACTION_RATING_REQUEST_FOOD_NO_LOCATION_NOT_ACCEPT_ANSWER = "rating.request.food.no.location.not.accept.answer";
const ACTION_FULL_TYPE_REQUEST = "full.type.request";

const successMessage = "success";
const PAYLOAD_PRICE = "price";
const PAYLOAD_LOCATION = "location";
const LOCATION_AMBIGUITY1 = "location_ambiguity1";
const LOCATION_AMBIGUITY2 = "location_ambiguity2";
const FOOD_AMBIGUITY1 = "Food_Ambiguity1";

const INPUT_INTENT_GREETING = "Greeting";
const INPUT_INTENT_FOOD_FIRST = "FoodFirst";
const INPUT_INTENT_LOCATION_FIRST = "LocationFirst";
const INPUT_INTENT_UNKNOWN = "Unknown";
const INPUT_INTENT_RATING_REQUEST_FOOD_IN_LOCATION = "RatingRequestFood_InLocation";
const INPUT_INTENT_RATING_REQUEST_FOOD_NO_LOCATION = "RatingRequestFood_NoLocation";
const INPUT_INTENT_FULL_TYPE_REQUEST = "FullTypeRequest";

const FB_VERIFY_TOKEN = config.FACEBOOK_TOKEN.VERIFY_TOKEN;

var app_apiai = apiai(config.API_AI.DEV_ACCESS_TOKEN);
var fbClient = new fbAPIRequest(config.FACEBOOK_TOKEN.FB_PAGE_ACCESS_TOKEN);

var userMappingObject = new Map();

var data;

//express
var express = require('express');
var router = express.Router();
module.exports = router;
router.get('/', function (req, res) {
    if (req.query['hub.verify_token'] == FB_VERIFY_TOKEN) {
        res.send(req.query['hub.challenge']);
        setTimeout(function () {
            fbClient.doSubscribeRequest();
        }, 3000);
    } else {
        res.send('Error, wrong validation token');
    }
});

router.get('/test', function (req, res) {
    console.log("ADADA");
});

router.post('/', function (req, res) {
    try {
        var messaging_events = req.body.entry[0].messaging;

        for (var i = 0; i < messaging_events.length; i++) {
            var event = req.body.entry[0].messaging[i];
            var sender = event.sender.id;
            console.log(event);

            // get current user
            var existUser;
            if (!userMappingObject.has(sender)) {
                console.log(uuid.v1());
                existUser = clientUser(uuid.v1(), sender);
                userMappingObject.set(sender, existUser);
            } else {
                existUser = userMappingObject.get(sender);
            }

            // normal event message
            if (event.message && event.message.text) {
                var opt = {
                    sessionId: existUser.getSessionID()
                };
                // check emoji to remove

                handleFacebookMessage(event.message.text, opt, function (response) {
                    handleAPIResponse(response, existUser);
                });

            }

            //handle payload
            if (event.postback) {
                var objectJSON = JSON.parse(event.postback.payload);
                var responseText;
                if (objectJSON.type === PAYLOAD_LOCATION) {
                    responseText = getLocation(objectJSON.id);
                }

                if (objectJSON.type === PAYLOAD_PRICE) {
                    responseText = getPrice(objectJSON.id);
                }

                existUser.sendFBMessageTypeText(responseText);
            }

            /**
             {attachments: [
                payload: {
                    title: Tran's Location,
                    type: location,
                    url: abc
                }
             ]}
             */
            //handle attachment
            if (event.message && event.message.attachments) {
                var type = event.message.attachments[0].type;
                if (type.toString() === "location") {
                    var url = event.message.attachments[0].url;
                    var param = getURLParam("where1", decodeURIComponent(url));
                    var location = param.split("%2C");
                    var locationObj = {
                        latitude: Number(location[0]),
                        longitude: Number(location[1])
                    }
                    var sql = 'select * from food where name  "%' + existUser.getFood().toString().trim() + '%"';

                    databaseConnection.connectToDatabase(sql, function (rows) {
                        data = rows;
                        var distanceAccepted = calculatePositionOfUserWithStore(locationObj, rows);
                        if (distanceAccepted.length > 0) {
                            var elementArray = [];

                            for (var i = 0; i < distanceAccepted.length; i++) {
                                var structureObj = createItemOfStructureResponse(distanceAccepted[i]);
                                elementArray.push(structureObj);
                            }
                            existUser.sendFBMessageTypeStructureMessage(elementArray);
                        } else {
                            var responseText = "Xin lỗi! Không có món bạn cần tìm ở gần đây :(";
                            existUser.sendFBMessageTypeText(responseText);
                        }
                    });
                }
            }
        }
        return res.status(200).json({
            status: "ok"
        });
    } catch (err) {
        console.log("ERROR: " + err);
        return res.status(400).json({
            status: "error",
            error: err
        });
    }
});

// location and price function
function getLocation(ID) {
    for (var i = 0; i < data.length; i++) {
        if (data[i].ID === ID) {
            return "Món " + data[i].name + " có tại địa chỉ " + data[i].address;
        }
    }
    return "Xin lỗi bạn! Hiện tại không có thông tin về địa chỉ!";
}

function getPrice(ID) {
    for (var i = 0; i < data.length; i++) {
        if (data[i].ID === ID) {
            return "Món " + data[i].name + " có giá " + data[i].price;
        }
    }
    return "Xin lỗi bạn! Hiện tại không có thông tin về giá của món ăn";
}

// parent handle response
function handleFacebookMessage(statements, option, callback) {
    var request = app_apiai.textRequest(statements, option);

    request.on('response', function (response) {
        // handleAPIResponse(response);
        return callback(response);
    });

    request.on('error', function (error) {
        console.log(error);
        // return callback(error);
    });

    request.end();
}

// handle
function handleAPIResponse(response, user) {
    console.log(response);
    var intentName = response.result.metadata.intentName;
    if (response.status.code === 200) {
        // greeting
        if (intentName.indexOf(INPUT_INTENT_GREETING) > -1) {
            var responseText = response.result.fulfillment.speech;
            var splittedText = util.splitResponse(responseText);
            for (var i = 0; i < splittedText.length; i++) {
                user.sendFBMessageTypeText(splittedText[i]);
            }
        }

        // food first
        if (intentName.indexOf(INPUT_INTENT_FOOD_FIRST) > -1) {
            console.log("food first");
            handleWordProcessingFoodFirst(response, user);
        }

        // location first
        if (intentName.indexOf(INPUT_INTENT_LOCATION_FIRST) > -1) {
            console.log("location first");
            handleWordProcessingLocationFirst(response, user);
        }

        // unknown request
        if (intentName.indexOf(INPUT_INTENT_UNKNOWN) > -1) {
            console.log("unknown");
            handleWordProccessingUnknown(response, user);
        }

        //rating request food in location
        if (intentName.indexOf(INPUT_INTENT_RATING_REQUEST_FOOD_IN_LOCATION) > -1) {
            console.log("rating request food in location");
            handleWordProccessingRatingFoodInLocationRequest(response, user)
        }

        // rating request food no location
        if (intentName.indexOf(INPUT_INTENT_RATING_REQUEST_FOOD_NO_LOCATION) > -1) {
            console.log("rating request food no location ");
            handleWordProcessingRatingFoodNoLocationRequest(response, user);
        }

        //full type request
        if (intentName.indexOf(INPUT_INTENT_FULL_TYPE_REQUEST) > -1) {
            console.log("full type request");
            handleWordProcessingFullTypeRequest(response, user);
        }
    }
}

//handle response processing full type request
function handleWordProcessingFullTypeRequest(response, user) {
    var action = response.result.action;
    var responseText = response.result.fulfillment.speech;
    var splittedText = util.splitResponse(responseText);
    var params = response.result.parameters;

    if (action === ACTION_FULL_TYPE_REQUEST) {
        if (splittedText.toString().trim() === successMessage) {
            user.setFood(params.Food);
            if (params.Location_Ambiguity && params.Location_Ambiguity === LOCATION_AMBIGUITY1) {
                user.setLocation(LOCATION_AMBIGUITY1);
                var responseText = "Bạn có thể chia sẻ địa điểm chính xác của bạn cho tôi được không?";
                user.sendFBMessageTypeText(responseText);
            } else {
                user.setLocation(params.Location);
                if (params.Location_Ambiguity && params.Location_Ambiguity === LOCATION_AMBIGUITY2) {
                    user.setLocation(LOCATION_AMBIGUITY2)
                    var sql = 'select * from food';
                } else if (params.Location) {
                    user.setLocation(params.Location);
                    var sql = 'select * from food where name like "%' + user.getFood().toString().trim() + '%" and address like "%' + user.getLocation().toString().trim() + '%"';
                }

                setTimeout(function () {
                    createStructureResponseQueryFromDatabase(sql, user);
                }, 2000);
            }

        }
    }

    if (action === ACTION_CHANGE_FOOD) {
        if (util.isDefined(user.getFood()) && util.isDefined(user.getLocation())) {
            var sql;
            // clear food
            if (params.Food) {
                user.setFood(params.Food);
                if (user.getLocation().toString().trim() === LOCATION_AMBIGUITY2) {
                    sql = 'select * from food where name like "%' + user.getFood().toString().trim() + '%"';
                } else {
                    user.sendFBMessageTypeText(responseText);
                    sql = 'select * from food where name like "%' + user.getFood().toString().trim() + '%" and address like "%' + user.getLocation().toString().trim() + '%"';
                    if (user.getLocation().toString().trim() === LOCATION_AMBIGUITY2) {
                        sql = 'select * from food';

                    }
                }

                // an gi cung dc
                if (params.Food_Ambiguity1) {
                    user.setFood(FOOD_AMBIGUITY1);
                    if (user.getLocation().toString().trim() === LOCATION_AMBIGUITY2) {
                        sql = "select * from food";
                    } else {
                        sql = 'select * from food where address like "%' + user.getLocation().toString().trim() + '%"';
                    }
                }
                setTimeout(function () {
                    createStructureResponseQueryFromDatabase(sql, user);
                }, 2000);

            }
        }
    }

    if (action === ACTION_CHANGE_LOCATION) {
        // have all
        if (util.isDefined(user.getFood()) && util.isDefined(user.getLocation())) {
            if (params.Location_Ambiguity && params.Location_Ambiguity === LOCATION_AMBIGUITY1) {
                var responseText = "Bạn có thể chia sẻ địa điểm chính xác của bạn cho tôi được không?";
                user.sendFBMessageTypeText(responseText);
            } else {
                var sql;

                if (params.Location_Ambiguity && params.Location_Ambiguity === LOCATION_AMBIGUITY2) {
                    user.setLocation(LOCATION_AMBIGUITY2);
                    sql = 'select * from food where name like "%' + user.getFood().toString().trim() + '%"';
                    if (user.getFood().toString().trim() === FOOD_AMBIGUITY1) {
                        sql = 'select * from food';
                    }
                } else {
                    user.setLocation(params.Location);
                    sql = 'select * from food where name like "%' + user.getFood().toString().trim() + '%" and address like "%' + user.getLocation().toString().trim() + '%"';
                    if (user.getFood().toString().trim() === FOOD_AMBIGUITY1) {
                        sql = 'select * from food where address like "%' + user.getLocation().toString().trim() + '%"';
                    }
                }
                setTimeout(function () {
                    createStructureResponseQueryFromDatabase(sql, user);
                }, 2000);
            }
        }

    }

}
//handle response processing rating request food no location
function handleWordProcessingRatingFoodNoLocationRequest(response, user) {
    var action = response.result.action;
    var responseText = response.result.fulfillment.speech;
    var splittedText = util.splitResponse(responseText);
    var params = response.result.parameters;

    if (action === ACTION_RATING_REQUEST_FOOD_NO_LOCATION) {
        for (var i = 0; i < splittedText.length; i++) {
            user.sendFBMessageTypeText(splittedText[i]);
        }
    }

    //show food rating cao
    if (action === ACTION_RATING_REQUEST_FOOD_NO_LOCATION_ACCEPT) {
        if (splittedText.toString().trim() === successMessage) {
            user.setFood(FOOD_AMBIGUITY1);
            user.setLocation(LOCATION_AMBIGUITY2);
            var sql = 'select * from food';
            setTimeout(function () {
                createStructureResponseQueryFromDatabase(sql, user);
            }, 2000);
        }
    }

    // ko dong y -> hoi
    if (action === ACTION_RATING_REQUEST_FOOD_NO_LOCATION_NOT_ACCEPT) {
        user.setFood(FOOD_AMBIGUITY1);
        if (params.Location_Ambiguity && params.Location_Ambiguity === LOCATION_AMBIGUITY1) {
            var responseText = "Bạn có thể chia sẻ địa điểm chính xác của bạn cho tôi được không?";
            user.sendFBMessageTypeText(responseText);
        } else if (params.Location) {
            user.sendFBMessageTypeText(responseText);
            var sql;
            user.setFood(FOOD_AMBIGUITY1);
            user.setLocation(params.Location);

            sql = 'select * from food where address like "%' + user.getLocation().toString().trim() + '%"';
            setTimeout(function () {
                createStructureResponseQueryFromDatabase(sql, user);
            }, 2000);
        } else {
            var responseText = "Bạn có thể cho tôi biết rõ bạn muốn ăn ở đâu";
            user.sendFBMessageTypeText(responseText);
        }
    }

    // user answer -> give location
    if (action === ACTION_RATING_REQUEST_FOOD_NO_LOCATION_NOT_ACCEPT_ANSWER) {
        if (splittedText.toString().trim() === successMessage) {
            if (params.Location_Ambiguity && params.Location_Ambiguity === LOCATION_AMBIGUITY1) {
                var responseText = "Bạn có thể chia sẻ địa điểm chính xác của bạn cho tôi được không?";
                user.sendFBMessageTypeText(responseText);
            } else {
                user.setLocation(params.Location);
                var sql = 'select * from food where address like "%' + user.getLocation().toString().trim() + '%"';

                setTimeout(function () {
                    createStructureResponseQueryFromDatabase(sql, user);
                }, 2000);
            }
        }
    }
}

//handle response processing rating request food in location
function handleWordProccessingRatingFoodInLocationRequest(response, user) {
    var action = response.result.action;
    var responseText = response.result.fulfillment.speech;
    var splittedText = util.splitResponse(responseText);
    var params = response.result.parameters;

    if (action === ACTION_RATING_REQUEST_FOOD_IN_LOCATION) {
        if (splittedText.toString().trim() === successMessage) {
            if (params.Location_Ambiguity && params.Location_Ambiguity === LOCATION_AMBIGUITY1) {
                var responseText = "Bạn có thể chia sẻ địa điểm chính xác của bạn cho tôi được không?";
                user.sendFBMessageTypeText(responseText);
            } else {
                var sql;
                user.setFood(FOOD_AMBIGUITY1);

                if (params.Location_Ambiguity && params.Location_Ambiguity === LOCATION_AMBIGUITY2) {
                    user.setLocation(params.Location_Ambiguity);
                    sql = 'select * from food';
                } else {
                    user.setLocation(params.Location);
                    sql = 'select * from food where address like "%' + user.getLocation().toString().trim() + '%"';
                }

                setTimeout(function () {
                    createStructureResponseQueryFromDatabase(sql, user);
                }, 2000);
            }
        }
    }
}

// handle response processing unknown
function handleWordProccessingUnknown(response, user) {
    var action = response.result.action;
    var responseText = response.result.fulfillment.speech;
    var splittedText = util.splitResponse(responseText);

    if (action === ACTION_UNKNOWN) {
        if (splittedText.length > 0 && splittedText.toString().trim() !== successMessage) {
            for (var i = 0; i < splittedText.length; i++) {
                user.sendFBMessageTypeText(splittedText[i]);
            }
        }
    }
}

// handle response processing location first
function handleWordProcessingLocationFirst(response, user) {
    var action = response.result.action;
    var responseText = response.result.fulfillment.speech;
    var splittedText = util.splitResponse(responseText);
    var params = response.result.parameters;

    if (action === ACTION_FIND_LOCATION) {
        var params = response.result.parameters;
        user.setLocation(params.Location);
        if (splittedText.length > 0 && splittedText.toString().trim() !== successMessage) {
            for (var i = 0; i < splittedText.length; i++) {
                user.sendFBMessageTypeText(splittedText[i]);
            }
        }
    }

    if (action === ACTION_FIND_FOOD) {
        if (splittedText.toString().trim() === successMessage) {
            var sql;
            if (params.Food_Ambiguity && params.Food_Ambiguity === FOOD_AMBIGUITY1) {
                sql = 'select * from food where address like "%' + user.getLocation().toString().trim() + '%"';
            } else {
                user.setFood(params.Food);
                sql = 'select * from food where name like "%' + user.getFood().toString().trim() + '%" and address like "%' + user.getLocation().toString().trim() + '%"';
            }
            setTimeout(function () {
                createStructureResponseQueryFromDatabase(sql, user);
            }, 2000);
        }
    }

    if (action === ACTION_CHANGE_LOCATION) {
        // have all
        if (util.isDefined(user.getFood()) && util.isDefined(user.getLocation())) {
            if (params.Location_Ambiguity && params.Location_Ambiguity === LOCATION_AMBIGUITY1) {
                var responseText = "Bạn có thể chia sẻ địa điểm chính xác của bạn cho tôi được không?";
                user.sendFBMessageTypeText(responseText);
            } else {
                var sql;

                if (params.Location_Ambiguity && params.Location_Ambiguity === LOCATION_AMBIGUITY2) {
                    user.setLocation(LOCATION_AMBIGUITY2);
                    sql = 'select * from food where name like "%' + user.getFood().toString().trim() + '%"';
                    if (user.getFood().toString().trim() === FOOD_AMBIGUITY1) {
                        sql = 'select * from food';
                    }
                } else {
                    user.setLocation(params.Location);
                    sql = 'select * from food where name like "%' + user.getFood().toString().trim() + '%" and address like "%' + user.getLocation().toString().trim() + '%"';
                    if (user.getFood().toString().trim() === FOOD_AMBIGUITY1) {
                        sql = 'select * from food where address like "%' + user.getLocation().toString().trim() + '%"';
                    }
                }
                setTimeout(function () {
                    createStructureResponseQueryFromDatabase(sql, user);
                }, 2000);
            }
        }

        // have location - do not have food
        if (!util.isDefined(user.getFood()) && util.isDefined(user.getLocation())) {
            user.setLocation(params.Location);
            var responseText = "Vâng bạn đổi địa điểm sang " + user.getLocation().toString().trim() + "! Bạn muốn ăn món gì :D";
            user.sendFBMessageTypeText(responseText);
        }
    }

    if (action == ACTION_CHANGE_FOOD) {
        // have all
        if (util.isDefined(user.getFood()) && util.isDefined(user.getLocation())) {
            var sql;
            // clear food
            if (params.Food) {
                user.setFood(params.Food);
                if (user.getLocation().toString().trim() === LOCATION_AMBIGUITY2) {
                    sql = 'select * from food where name like "%' + user.getFood().toString().trim() + '%"';
                } else {
                    user.sendFBMessageTypeText(responseText);
                    sql = 'select * from food where name like "%' + user.getFood().toString().trim() + '%" and address like "%' + user.getLocation().toString().trim() + '%"';
                    if (user.getLocation().toString().trim() === LOCATION_AMBIGUITY2) {
                        sql = 'select * from food';
                    }
                }
            }

            // an gi cung dc
            if (params.Food_Ambiguity) {
                user.setFood(FOOD_AMBIGUITY1);
                if (user.getLocation().toString().trim() === LOCATION_AMBIGUITY2) {
                    sql = "select * from food";
                } else {
                    sql = 'select * from food where address like "%' + user.getLocation().toString().trim() + '%"';
                }
            }
            setTimeout(function () {
                createStructureResponseQueryFromDatabase(sql, user);
            }, 2000);
        }

    }
}


// handle response processing food first
function handleWordProcessingFoodFirst(response, user) {
    var action = response.result.action;
    var responseText = response.result.fulfillment.speech;
    var splittedText = util.splitResponse(responseText);
    var params = response.result.parameters;

    if (action === ACTION_FIND_FOOD) {
        user.setFood(params.Food);
        if (splittedText.length > 0 && splittedText.toString().trim() !== successMessage) {
            for (var i = 0; i < splittedText.length; i++) {
                user.sendFBMessageTypeText(splittedText[i]);
            }
        }
    }

    if (action === ACTION_FIND_LOCATION) {
        if (splittedText.toString().trim() === successMessage) {
            if (params.Location_Ambiguity && params.Location_Ambiguity === LOCATION_AMBIGUITY1) {
                var responseText = "Bạn có thể chia sẻ địa điểm chính xác của bạn cho tôi được không?";
                user.sendFBMessageTypeText(responseText);
            } else {
                var sql;
                if (params.Location_Ambiguity && params.Location_Ambiguity === LOCATION_AMBIGUITY2) {
                    user.setLocation(LOCATION_AMBIGUITY2);
                    sql = 'select * from food where name like "%' + user.getFood().toString().trim() + '%"';
                } else {
                    user.setLocation(params.Location);
                    sql = 'select * from food where name like "%' + user.getFood().toString().trim() + '%" and address like "%' + user.getLocation().toString().trim() + '%"';
                }
                setTimeout(function () {
                    createStructureResponseQueryFromDatabase(sql, user);
                }, 2000);
            }
        }
    }

    if (action === ACTION_CHANGE_FOOD) {
        // have all
        if (util.isDefined(user.getFood()) && util.isDefined(user.getLocation())) {
            var sql;
            // clear food
            if (params.Food) {
                user.setFood(params.Food);
                if (user.getLocation().toString().trim() === LOCATION_AMBIGUITY2) {
                    sql = 'select * from food where name like "%' + user.getFood().toString().trim() + '%"';
                } else {
                    user.sendFBMessageTypeText(responseText);
                    sql = 'select * from food where name like "%' + user.getFood().toString().trim() + '%" and address like "%' + user.getLocation().toString().trim() + '%"';
                    if (user.getLocation().toString().trim() === LOCATION_AMBIGUITY2) {
                        sql = 'select * from food';
                    }
                }
            }

            // an gi cung dc
            if (params.Food_Ambiguity) {
                user.setFood(FOOD_AMBIGUITY1);
                if (user.getLocation().toString().trim() === LOCATION_AMBIGUITY2) {
                    sql = "select * from food";
                } else {
                    sql = 'select * from food where address like "%' + user.getLocation().toString().trim() + '%"';
                }
            }

            setTimeout(function () {
                createStructureResponseQueryFromDatabase(sql, user);
            }, 2000);
        }

        // have food - do not have location
        if (util.isDefined(user.getFood()) && !util.isDefined(user.getLocation())) {
            user.setFood(params.Food);
            var responseText = "Vâng bạn đổi sang món " + user.getFood().toString().trim() + "! Bạn muốn ăn ở đâu?";
            user.sendFBMessageTypeText(responseText);
        }
    }

    if (action == ACTION_CHANGE_LOCATION) {
        if (util.isDefined(user.getFood()) && util.isDefined(user.getLocation())) {
            if (params.Location_Ambiguity && params.Location_Ambiguity === LOCATION_AMBIGUITY1) {
                var responseText = "Bạn có thể chia sẻ địa điểm chính xác của bạn cho tôi được không?";
                user.sendFBMessageTypeText(responseText);
            } else {
                var sql;

                if (params.Location_Ambiguity && params.Location_Ambiguity === LOCATION_AMBIGUITY2) {
                    user.setLocation(LOCATION_AMBIGUITY2);
                    sql = 'select * from food where name like "%' + user.getFood().toString().trim() + '%"';
                    if (user.getFood().toString().trim() === FOOD_AMBIGUITY1) {
                        sql = 'select * from food';
                    }
                } else {
                    user.setLocation(params.Location);
                    sql = 'select * from food where name like "%' + user.getFood().toString().trim() + '%" and address like "%' + user.getLocation().toString().trim() + '%"';
                    if (user.getFood().toString().trim() === FOOD_AMBIGUITY1) {
                        sql = 'select * from food where address like "%' + user.getLocation().toString().trim() + '%"';
                    }
                }
                setTimeout(function () {
                    createStructureResponseQueryFromDatabase(sql, user);
                }, 2000);
            }
        }
    }
}

// create structure response for facebook base on data query from database
function createStructureResponseQueryFromDatabase(sql, user) {
    databaseConnection.connectToDatabase(sql, function (rows, err) {
        if (util.isDefined(err)) {
            return new Error(err);
        } else {
            data = rows;
            if (rows.length > 0) {
                var elementArray = [];
                var lengthArray = rows.length > 10 ? 10 : rows.length;
                for (var i = 0; i < lengthArray; i++) {
                    var structureObj = createItemOfStructureResponse(rows[i]);
                    elementArray.push(structureObj);
                }
                user.sendFBMessageTypeStructureMessage(elementArray);
            } else {
                var responseText = "Chân thành xin lỗi! Món ăn bạn tìm hiện tại không có!";
                user.sendFBMessageTypeText(responseText);
            }
        }
    });
}

function createItemOfStructureResponse(item) {
    var structureObj = {};
    structureObj.title = item.name;
    structureObj.image_url = item.thumbpath;
    structureObj.subtitle = "Soft white cotton t-shirt is back in style";

    var buttons = [];
    var button1 = util.createButton("Xem chi tiết", config.BUTTON_TYPE.web_url, item.source);
    buttons.push(button1);

    var priceObjPostback = {
        id: item.ID,
        type: "price"
    };
    var button2 = util.createButton("Xem giá", config.BUTTON_TYPE.postback, JSON.stringify(priceObjPostback));
    buttons.push(button2);

    var locationObjPostback = {
        id: item.ID,
        type: "location"
    };
    var button3 = util.createButton("Xem địa chỉ", config.BUTTON_TYPE.postback, JSON.stringify(locationObjPostback));
    buttons.push(button3);
    structureObj.buttons = buttons;

    return structureObj;
}

// calcualate position
function calculatePositionOfUserWithStore(userLocation, data) {
    var distanceAccepted = [];

    for (var i = 0; i < data.length; i++) {
        var d = getDistanceFromLatLonInKm(userLocation.latitude, userLocation.longitude, data[i].latitude, data[i].longitude);
        console.log("distance: " + d);

        if (d <= 7) {
            distanceAccepted.push(data[i]);
        }
    }

    return distanceAccepted;
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);  // deg2rad below
    var dLon = deg2rad(lon2 - lon1);
    var a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180)
}

function getURLParam(name, url) {
    if (!url) url = location.href;
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(url);
    return results == null ? null : results[1];
}
