var config = require('../../../common/app-config').config;
var util = require('../../../common/CommonUtil');
var apiai = require('apiai');
var logHandle = require('./../../LogHandler/Logger');
var app_apiai = apiai(config.API_AI.DEV_ACCESS_TOKEN);
var responseFilter = require('../../../common/FilterResponse');
var databaseConnection = require('./../../DBManager/Database');
var greetingMessageFilter = require('../MessageHandler/MessageFilter/GreetingMessage');

const PAYLOAD_LOCATION = "location";
const PAYLOAD_REPORT = "report";
const PAYLOAD_FOOD = "food";
const PAYLOAD_REQUEST = "request";
const PAYLOAD_CANCEL = "cancel";
const PAYLOAD_CONTINUE = "continue";
const PAYLOAD_FEEDBACK = "feedback"
const PAYLOAD_CHANGE = "change";
const PAYLOAD_ASK_LOCATION = "ask_location";
const PAYLOAD_ASK_FOOD = "ask_food";
const PAYLOAD_YES_NO = 'yes_no';
const PAYLOAD_SENSATION = 'sensation';
const PAYLOAD_TREND = 'trend';
const PAYLOAD_GUIDELINE = 'guideline';
const PAYLOAD_MORE = 'more';
const PAYLOAD_HOTKEY_GUIDELINE = 'hotkey_guideline';
const PAYLOAD_GET_START = 'get_start';

module.exports = createPostbackHandler;

function PostbackHandler(user, userMappingObject) {
    this.user = user;
    this.userMappingObj = userMappingObject || {};
}

function createPostbackHandler(user, userMappingObject) {
    if (!util.isDefined(user)) {
        return new Error('Lack of user ');
    }

    if (!util.isDefined(userMappingObject)) {
        return new Error('Lack of userMappingObject ');
    }

    return new PostbackHandler(user, userMappingObject);
}

PostbackHandler.prototype.handelPostback = function (jsonObject) {
    return handlePostback(jsonObject, this.user, this.userMappingObj);
};

PostbackHandler.prototype.handleGetStartButtonPostback = function (tmpString) {
    return handleGetStartButtonPostback(tmpString, this.user);
};


function handlePostback(jsonObject, user, userMappingObject) {
    switch (jsonObject.type) {
        case PAYLOAD_CANCEL:
            return handleCancelPostback(user, userMappingObject);
        case PAYLOAD_LOCATION:
            return handleGetLocationPostback(jsonObject, user);
        case PAYLOAD_CONTINUE:
            return handelPagingItemPostback(jsonObject, user);
        case PAYLOAD_CHANGE:
            return handleChangeItemPostback(jsonObject, user);
        case PAYLOAD_ASK_LOCATION:
            return handleAskLocationPostback(jsonObject, user);
        case PAYLOAD_ASK_FOOD:
            return handleAskFoodPostback(jsonObject, user);
        case PAYLOAD_YES_NO:
            return handleYesNoPostback(jsonObject, user);
        case PAYLOAD_SENSATION:
            return handleSensationPostback(jsonObject, user);
        case PAYLOAD_REPORT:
            return handleReportFromUuser(jsonObject, user);
        case PAYLOAD_FEEDBACK:
            return handleFeedbackFromUser(jsonObject, user);
        case PAYLOAD_TREND:
            return handleRatingPostbackFromUser(jsonObject, user);
        case PAYLOAD_MORE:
            return handleMoreFunctionPostback(jsonObject, user);
        case PAYLOAD_GUIDELINE:
            return handleGuidelineFunctionPostback(jsonObject, user);
        case PAYLOAD_HOTKEY_GUIDELINE:
            return handleHotkeyGuidelinePostback(jsonObject, user);
        case PAYLOAD_GET_START:
            return handleCollectUserInformation(jsonObject, user);
        default:
            break;
    }
}

function handleCollectUserInformation(jsonObject, user) {
    if (jsonObject.isStart === 'yes') {
        var responseText = 'Bạn có thể cho tôi biết nơi bạn ở hiện tại là ở quận nào được không :D';
        user.sendFBQuickReplyMessage([
            {
                "content_type": "text",
                "title": config.districts.district_phu_nhuan.name,
                "payload": JSON.stringify({
                    type : 'user_location',
                    district :  config.districts.district_phu_nhuan.name
                })
            },
            {
                "content_type": "text",
                "title": config.districts.district_thu_duc.name,
                "payload": JSON.stringify({
                    type : 'user_location',
                    district :  config.districts.district_thu_duc.name
                })
            },
            {
                "content_type": "text",
                "title": config.districts.district_go_vap.name,
                "payload": JSON.stringify({
                    type : 'user_location',
                    district :  config.districts.district_go_vap.name
                })
            },
            {
                "content_type": "text",
                "title": config.districts.district_binh_thanh.name,
                "payload": JSON.stringify({
                    type : 'user_location',
                    district :  config.districts.district_binh_thanh.name
                })
            },
            {
                "content_type": "text",
                "title": config.districts.district_tan_binh.name,
                "payload": JSON.stringify({
                    type : 'user_location',
                    district :  config.districts.district_tan_binh.name
                })
            },
            {
                "content_type": "text",
                "title": config.districts.district_1.name,
                "payload": JSON.stringify({
                    type : 'user_location',
                    district :  config.districts.district_1.name
                })
            },
            {
                "content_type": "text",
                "title": config.districts.district_2.name,
                "payload": JSON.stringify({
                    type : 'user_location',
                    district :  config.districts.district_2.name
                })
            },
            {
                "content_type": "text",
                "title": config.districts.district_7.name,
                "payload": JSON.stringify({
                    type : 'user_location',
                    district :  config.districts.district_7.name
                })
            },
            {
                "content_type": "text",
                "title": config.districts.district_10.name,
                "payload": JSON.stringify({
                    type : 'user_location',
                    district :  config.districts.district_10.name
                })
            },
            {
                "content_type": "text",
                "title": config.districts.district_5.name,
                "payload": JSON.stringify({
                    type : 'user_location',
                    district :  config.districts.district_5.name
                })
            },
        ], responseText);
    }
}

function handleHotkeyGuidelinePostback(jsonObject, user) {
    if (jsonObject.hotkeyGuidelineType === 'map') {
        var responseText = "Bạn có thể xem nhanh bản đồ theo cú pháp sau: \nMap: Vị trí Item \nVí dụ: Map: 1";
        user.sendFBMessageTypeText(responseText);
    }

    if (jsonObject.hotkeyGuidelineType === 'paging') {
        var responseText = "Bạn có thể chuyển nhanh tới hoặc lùi 10 phần theo cú pháp: \nNext - tới 10 item \nBack - quay lại 10";
        user.sendFBMessageTypeText(responseText);
    }

}

function handleGetStartButtonPostback(tmpString, user) {
    if (tmpString === 'get_start') {
        return greetingMessageFilter.getCurrentSenderInformationWhenGetStart(user);
    }


}

//handle more function postback
function handleMoreFunctionPostback(jsonObject, user) {
    if (jsonObject.typeMore === 'more_function') {
        var elementArray = util.createItemOfStructureButton(config.MORE_FUNCTION_BUTTON, user);
        var responseText = 'Bạn có thể chọn 1 trong những chức năng dưới đây :D';
        user.sendFBMessageTypeButtonTemplate(elementArray, responseText);
    }

    if (jsonObject.typeMore === 'training') {
        var responseText = 'Xin hãy nhập câu bạn muốn train cho Bot :D';
        user.sendFBMessageTypeText(responseText);
    }

    if (jsonObject.typeMore === 'guideline_function') {
        var elementArray = util.createItemOfStructureButton(config.HOTKEY_GUIDELINE_BUTTON, user);
        var responseText = 'Bạn có thể xem hướng dẫn phím ở dưới đây :D';
        user.sendFBMessageTypeButtonTemplate(elementArray, responseText);
    }
}

//handle guideline postback
function handleGuidelineFunctionPostback(jsonObject, user) {
    if (jsonObject.typeMore === 'guideline_function') {
        var elementArray = util.createItemOfStructureButton(config.GUIDELINE_BUTTON, user);
        var responseText = 'Bạn có thể xem hướng dẫn dưới đây để có thể sử dụng tốt nhất :D';
        user.sendFBMessageTypeButtonTemplate(elementArray, responseText);
    }

    if (jsonObject.typeGuideline === 'hotkey') {
        var elementArray = util.createItemOfStructureButton(config.GUIDELINE_BUTTON, user);
        var responseText = 'Bạn có thể xem hướng dẫn dưới đây để có thể sử dụng tốt nhất :D';
        user.sendFBMessageTypeButtonTemplate(elementArray, responseText);
    }

    if (jsonObject.typeGuideline === 'training') {
        var responseText = 'Bạn có thể training cho bot bằng cách nhập theo cú pháp sau: \n[train: "câu bạn muốn train"]\nVD: train: ăn bánh mì!';
        user.sendFBMessageTypeText(responseText);
    }
}

//handle rating_food postback
function handleRatingPostbackFromUser(jsonObject, user) {
    if (jsonObject.typeTrend === 'food') {
        var setSql = "SET sql_mode = '';";
        var querySql = 'SELECT * FROM productdetail order by rate desc limit 10';
        var sql = setSql + querySql;
        databaseConnection.queryMultipleSQLStatements(sql, function (rows, err) {
            if (err) {
                console.log("ERROR DB: " + err.message);
            } else {
                console.log("query success");
                user.setData(rows);
                var currentData = [];
                if (rows.length > 0) {
                    var elementArray = [];
                    var lengthArray = rows.length >= 10 ? 10 : rows.length;
                    user.setCurrentPositionItem(lengthArray);
                    for (var i = 0; i < lengthArray; i++) {
                        currentData[i] = rows[i];
                        var structureObj = util.createItemOfStructureResponseForProduct(rows[i]);
                        elementArray.push(structureObj);
                    }

                    user.setCurrentData(currentData);
                    user.sendFBMessageTypeStructureMessage(elementArray);
                    // nếu lớn hơn 10  thì mới paging
                    if (rows.length > 10) {
                        setTimeout(function () {
                            var pagingButton = util.createItemOfStructureButton(config.PAGING_BUTTON, user);
                            user.sendFBMessageTypeButtonTemplate(pagingButton, "Bạn có muốn tiếp tục xem những món mới không :D");
                        }, 5000);
                    }
                }
            }
        });
    }

    if (jsonObject.typeTrend === 'location') {
        var setSql = "SET sql_mode = '';";
        var querySql = 'SELECT  restaurantName,AVG(rate) as Rate_Avg FROM productdetail group by addressId order by Rate_Avg desc limit 10';
        var sql = setSql + querySql;
        databaseConnection.queryMultipleSQLStatements(sql, function (rows, err) {
            if (err) {
                console.log("ERROR DB: " + err.message);
            } else {
                console.log("query success");
                user.setData(rows);
                var currentData = [];
                if (rows.length > 0) {
                    var elementArray = [];
                    var lengthArray = rows.length >= 10 ? 10 : rows.length;
                    user.setCurrentPositionItem(lengthArray);
                    for (var i = 0; i < lengthArray; i++) {
                        currentData[i] = rows[i];
                        var structureObj = util.createItemOfStructureResponseForRestaurant(rows[i]);
                        elementArray.push(structureObj);
                    }

                    user.setCurrentData(currentData);
                    user.sendFBMessageTypeStructureMessage(elementArray);
                    // nếu lớn hơn 10  thì mới paging
                    if (rows.length > 10) {
                        setTimeout(function () {
                            var pagingButton = util.createItemOfStructureButton(config.PAGING_BUTTON, user);
                            user.sendFBMessageTypeButtonTemplate(pagingButton, "Bạn có muốn tiếp tục xem những món mới không :D");
                        }, 5000);
                    }
                }
            }
        });
    }
}

//handle feedback 
function handleFeedbackFromUser(jsonObject, user) {
    if (jsonObject.isAccept === 'yes') {
        var responseText = "Bạn hãy làm theo cú pháp sau: \n[feedback: nhập feedback]\nVD: feedback: anh thành làm bot kinh vl";
        user.sendFBMessageTypeText(responseText);
    }

    if (jsonObject.isAccept === 'no') {
        var responseText = 'Lần sau bạn lại ghé thăm nữa nhé :D';
        user.sendFBMessageTypeText(responseText);
    }
}

//handle report payload
function handleReportFromUuser(jsonObject, user) {
    console.log("report: ", jsonObject);
    logHandle(user.getSenderID(), 400, jsonObject);
    var responseText = responseFilter.randomReportResponseFilterResponse();
    user.sendFBMessageTypeText(responseText);
}

// handle postback cancel
function handleCancelPostback(user, userMappingObject) {
    userMappingObject.delete(user.getSenderID());
    var responseText = "Cảm ơn bạn đã quan tâm :D Bạn có thể giúp tôi làm 1 ít feedback được không :D";
    var elementArray = util.createItemOfStructureButton(config.YES_NO_BUTTON, user);
    user.sendFBMessageTypeButtonTemplate(elementArray, responseText);
}

// handle postback paging
function handelPagingItemPostback(jSonObject, user) {
    var elementArray = [];
    var currentData = [];
    var data = user.getData();
    var temp;
    var count = 0;
    if (jSonObject.isNext === 1) {
        if (user.getCurrentPosition() + 10 >= data.length) {
            temp = data.length - user.getCurrentPosition();

            for (var i = user.getCurrentPosition(); i < data.length; i++) {
                currentData[count] = data[i];
                count++;
                var structureObj = util.createItemOfStructureResponseForProduct(data[i]);
                elementArray.push(structureObj);
            }
            user.sendFBMessageTypeStructureMessage(elementArray);
            user.setCurrentData(currentData);

            setTimeout(function () {
                elementArray = util.createItemOfStructureButton(config.PAGING_BUTTON, user);
                user.sendFBMessageTypeButtonTemplate(elementArray, "Bạn có muốn tiếp tục xem những món mới không :D");
            }, 5000);

            user.setCurrentPositionItem(user.getCurrentPosition() + temp);
        } else if (user.getCurrentPosition() + 10 < data.length) {
            for (var i = user.getCurrentPosition(); i < user.getCurrentPosition() + 10; i++) {
                currentData[count] = data[i];
                count++;
                var structureObj = util.createItemOfStructureResponseForProduct(data[i]);
                elementArray.push(structureObj);
            }
            user.setCurrentData(currentData);
            user.sendFBMessageTypeStructureMessage(elementArray);

            setTimeout(function () {
                elementArray = util.createItemOfStructureButton(config.PAGING_BUTTON, user);
                user.sendFBMessageTypeButtonTemplate(elementArray, "Bạn có muốn tiếp tục xem những món mới không :D");
            }, 5000);
            user.setCurrentPositionItem(user.getCurrentPosition() + 10);
        }
    }

    if (jSonObject.isNext === 0) {
        if (user.getCurrentPosition() - 10 < 0) {
            temp = user.getCurrentPosition() - 0;
            user.setCurrentPositionItem(0);
            for (var i = user.getCurrentPosition(); i < temp; i++) {
                currentData[count] = data[i];
                count++;
                var structureObj = util.createItemOfStructureResponseForProduct(data[i]);
                elementArray.push(structureObj);
            }
            user.setCurrentData(currentData);
            user.sendFBMessageTypeStructureMessage(elementArray);

            setTimeout(function () {
                elementArray = util.createItemOfStructureButton(config.PAGING_BUTTON, user);
                user.sendFBMessageTypeButtonTemplate(elementArray, "Bạn có muốn tiếp tục xem những món mới không :D");
            }, 5000);
        } else if (user.getCurrentPosition() - 10 >= 0) {
            user.setCurrentPositionItem(user.getCurrentPosition() - 10);
            if (user.getCurrentPosition() - 10 < 0) {
                for (var i = 0; i < existUser.getCurrentPosition(); i++) {
                    currentData[count] = data[i];
                    count++
                    var structureObj = util.createItemOfStructureResponseForProduct(data[i]);
                    elementArray.push(structureObj);
                }
            } else if (user.getCurrentPosition() - 10 >= 0) {
                for (var i = user.getCurrentPosition() - 10; i < user.getCurrentPosition(); i++) {
                    currentData[count] = data[i];
                    count++
                    var structureObj = util.createItemOfStructureResponseForProduct(data[i]);
                    elementArray.push(structureObj);
                }
            }
            user.setCurrentData(currentData);
            user.sendFBMessageTypeStructureMessage(elementArray);

            setTimeout(function () {
                elementArray = util.createItemOfStructureButton(config.PAGING_BUTTON, user);
                user.sendFBMessageTypeButtonTemplate(elementArray, "Bạn có muốn tiếp tục xem những món mới không :D");
            }, 5000);
        }
    }
}

// handle change post back
function handleChangeItemPostback(jsonObject, user) {
    if (jsonObject.changeType === PAYLOAD_REQUEST) {
        var elementArray = util.createItemOfStructureButton(config.CHANGE_BUTTON_TYPE_1);
        var responseText = 'Bạn muốn đổi món hay đổi địa điểm :D';
        user.sendFBMessageTypeButtonTemplate(elementArray, responseText);
    }

    if (jsonObject.changeType === PAYLOAD_FOOD) {
        var responseText = 'Bạn có thể cho tôi biết bạn đổi sang món gì được không?'
        user.sendFBMessageTypeText(responseText);
    }

    if (jsonObject.changeType === PAYLOAD_LOCATION) {
        var elementArray = util.createItemOfStructureButton(config.ASK_LOCATION_BUTTON);
        var responseText = 'Bạn muốn đổi sang địa điểm nào :D ';
        user.sendFBMessageTypeButtonTemplate(elementArray, responseText);
    }
}

//handle ask location postback
function handleAskLocationPostback(jsonObject, user) {
    var opt = {
        sessionId: user.getSessionID()
    };

    // near my place
    if (jsonObject.locationType === config.LOCATION_AMBIGUITY1) {
        user.setLocation({
            name: config.LOCATION_AMBIGUITY1,
            type: config.location_type.nearby
        });
        sendDummyRequestToApi(config.LOCATION_AMBIGUITY1, opt, function (response) {
            user.setStatusCode(200);
            user.setResponseAPI(response);
            console.log("send dummy request successfully");
        });
        var responseText = "Bạn hãy chia sẽ địa điểm của bạn cho tôi thông qua Facebook Messenger :D";
        user.sendFBMessageTypeText(responseText);
    }

    // any place
    if (jsonObject.locationType === config.LOCATION_AMBIGUITY2) {
        user.setLocation({
            name: config.LOCATION_AMBIGUITY2,
            type: config.location_type.anywhere
        });
        sendDummyRequestToApi(config.LOCATION_AMBIGUITY2, opt, function (response) {
            user.setStatusCode(200);
            user.setResponseAPI(response);
            console.log("send dummy request successfully");
        });
        util.checkQueryOrCache(user, config.QUERY_TYPE.ONLY_FOOD);
    }

    if (jsonObject.locationType === 'my_location') {
        var responseText = 'Bạn có thể cho tôi biết bạn muốn ăn ở quận nào được không :D';
        user.sendFBMessageTypeText(responseText);
    }
}

//handle ask food postback
function handleAskFoodPostback(jsonObject, user) {
    var opt = {
        sessionId: user.getSessionID()
    };

    if (jsonObject.foodType === config.FOOD_AMBIGUITY1) {
        user.setFood(config.FOOD_AMBIGUITY1);
        sendDummyRequestToApi(config.FOOD_AMBIGUITY1, opt, function (response) {
            user.setStatusCode(200);
            user.setResponseAPI(response);
            console.log("send dummy request successfully");
        });
        util.checkQueryOrCache(user, config.QUERY_TYPE.ONLY_LOCATION);
    }

    if (jsonObject.foodType === 'my_food') {
        var responseText = 'Bạn hãy nhập tên món ăn mà bạn muốn ăn :D';
        user.sendFBMessageTypeText(responseText);
    }
}

//handle yes no postback
function handleYesNoPostback(jsonObject, user) {
    var opt = {
        sessionId: user.getSessionID()
    };

    sendDummyRequestToApi(jsonObject.isYes, opt, function (response) {
        if (response) {
            user.setStatusCode(200);
            user.setResponseAPI(response);
            console.log("send dummy request successfully");
        }
    });

    if (jsonObject.isYes === 'no') {
        user.setLocation({
            name: config.LOCATION_AMBIGUITY2,
            type: config.location_type.anywhere
        });
        util.checkQueryOrCache(user, config.QUERY_TYPE.NO_FOOD_LOCATION)
    }

    if (jsonObject.isYes === 'yes') {
        var elementArray = [{
            type: "postback",
            title: "Ăn ở gần đây",
            payload: JSON.stringify({
                type: "ask_location",
                locationType: config.LOCATION_AMBIGUITY1
            })
        }, {
            type: "postback",
            title: "Chỗ tôi chỉ định",
            payload: JSON.stringify({
                type: "ask_location",
                locationType: "my_location"
            })
        }, {
            type: "postback",
            title: "Thôi no r`! Không ăn nữa đâu",
            payload: JSON.stringify({
                type: "cancel"
            })
        }];
        var responseText = 'Bạn muốn ăn ở gần đây hay chỗ nào cũng đươc :D';
        user.sendFBMessageTypeButtonTemplate(elementArray, responseText);
    }
}

// handle sensation postback
function handleSensationPostback(jsonObject, user) {
    var opt = {
        sessionId: user.getSessionID()
    };

    if (jsonObject.isYes === 'yes') {
        var elementArray = util.createItemOfStructureButton(config.ASK_FOOD_BUTTON_TYPE_SENSATION);
        sendDummyRequestToApi(jsonObject.isYes, opt, function (response) {
            if (response) {
                user.setStatusCode(200);
                user.setResponseAPI(response);
                console.log("send dummy request successfully");
            }
        });
        var responseText = 'Bạn muốn ăn món gì nhỉ?';
        user.sendFBMessageTypeButtonTemplate(elementArray, responseText);
    }

    // near my place
    if (jsonObject.locationType === config.LOCATION_AMBIGUITY1) {
        user.setLocation({
            name: config.LOCATION_AMBIGUITY1,
            type: config.location_type.nearby
        });
        sendDummyRequestToApi(config.LOCATION_AMBIGUITY1, opt, function (response) {
            user.setStatusCode(200);
            user.setResponseAPI(response);
            console.log("send dummy request successfully");
        })
        var responseText = "Bạn hãy chia sẽ địa điểm của bạn cho tôi thông qua Facebook Messenger :D";
        user.sendFBMessageTypeText(responseText);
    }

    // any place
    if (jsonObject.locationType === config.LOCATION_AMBIGUITY2) {
        user.setLocation({
            name: config.LOCATION_AMBIGUITY2,
            type: config.location_type.anywhere
        });
        sendDummyRequestToApi(config.LOCATION_AMBIGUITY2, opt, function (response) {
            user.setStatusCode(200);
            user.setResponseAPI(response);
            console.log("send dummy request successfully");
        });
        var typeQuery;
        if (user.getFood() === config.FOOD_AMBIGUITY1) {
            typeQuery = config.QUERY_TYPE.NO_FOOD_LOCATION;
        } else {
            typeQuery = config.QUERY_TYPE.ONLY_FOOD;
        }
        util.checkQueryOrCache(user, typeQuery);
    }

    // my location
    if (jsonObject.locationType === 'my_location') {
        var responseText = 'Bạn có thể cho tôi biết bạn muốn ăn ở quận nào được không :D';
        user.sendFBMessageTypeText(responseText);
    }

    // food ambiguity
    if (jsonObject.foodType === config.FOOD_AMBIGUITY1) {
        user.setFood(config.FOOD_AMBIGUITY1);
        sendDummyRequestToApi(config.FOOD_AMBIGUITY1, opt, function (response) {
            if (response) {
                user.setStatusCode(200);
                user.setResponseAPI(response);
                console.log("send dummy request successfully");
            }
        });
        var elementArray = [{
            type: "postback",
            title: "Chỗ nào gần đây thôi!",
            payload: JSON.stringify({
                type: "sensation",
                locationType: config.LOCATION_AMBIGUITY1
            })
        }, {
            type: "postback",
            title: "Chỗ nào ngon là đi!",
            payload: JSON.stringify({
                type: "sensation",
                locationType: config.LOCATION_AMBIGUITY2
            })
        }, {
            type: "postback",
            title: "Đê tôi chọn chỗ!",
            payload: JSON.stringify({
                type: "sensation",
                locationType: 'my_location'
            })
        }];
        var responseText = 'Vậy bạn muốn ăn ở gần đây hay ăn đâu cũng được nhỉ :D';
        user.sendFBMessageTypeButtonTemplate(elementArray, responseText);
    }

    if (jsonObject.foodType === 'my_food') {
        var responseText = 'Xin hãy nhập tên món ăn bạn muốn :D';
        user.sendFBMessageTypeText(responseText);
    }
}

function handleGetLocationPostback(jsonObject, user) {
    var responseText = getLocation(jsonObject.productId, jsonObject.addressId, user.getData());
    user.sendFBMessageTypeText(responseText);
}

// location and price function
function getLocation(productId, addressId, data) {
    for (var i = 0; i < data.length; i++) {
        if (data[i].productId === productId && data[i].addressId === addressId) {
            return "Món " + data[i].productName + " có tại địa chỉ " + data[i].addressName;
        }
    }
    return "Xin lỗi bạn! Hiện tại không có thông tin về địa chỉ!";
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