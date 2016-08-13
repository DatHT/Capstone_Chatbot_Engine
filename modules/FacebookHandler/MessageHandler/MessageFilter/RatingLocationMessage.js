var config = require('../../../../common/app-config').config;
var util = require('../../../../common/CommonUtil');
var databaseConnection = require('../../../DBManager/Database');

module.exports = createRatingLocationMessage;

function RatingLocationMessage(user) {
    this.user = user;
}

function createRatingLocationMessage(user) {
    if (!util.isDefined(user)) {
        return new Error('lack of current user');
    }
    return new RatingLocationMessage(user);
}

RatingLocationMessage.prototype.handleWordPrcccessingRatingRequestLocationStatement = function (response) {
    return handleWordPrcccessingRatingRequestLocationStatement(response, this.user);
};

//handle response processing rating request location
function handleWordPrcccessingRatingRequestLocationStatement(response, user) {
    var action = response.result.action;
    var responseText = response.result.fulfillment.speech;
    var splittedText = util.splitResponse(responseText);
    var params = response.result.parameters;

    if (action === config.ACTION_RATING_REQUEST_LOCATION) {
        if (splittedText.length > 0 && splittedText.toString().trim() === config.successMessage) {
            user.setFood(params.Food);
            user.setLocation({
                name: config.LOCATION_AMBIGUITY2,
                type: config.location_type.anywhere
            });
            var setSql = "SET `sql_mode` = '';";
            var querySql = 'SELECT * FROM `productdetail` where `synonymName` regexp "' + user.getFood().trim() + '" group by `restaurantName` order by `rate` desc ';
            var sql = setSql + querySql;
            databaseConnection.queryMultipleSQLStatements(sql, function (rows, err) {
                if (err) {
                    console.log("ERROR DB: " + err.message);
                } else {
                    console.log("quqery success");
                    user.setData(rows);
                    var data = user.getData();
                    if (rows.length > 0) {
                        var elementArray = [];
                        var lengthArray = rows.length >= 10 ? 10 : rows.length;
                        user.setCurrentPositionItem(lengthArray);
                        for (var i = 0; i < lengthArray; i++) {
                            var structureObj = util.createItemOfStructureResponseForRestaurant(rows[i]);
                            elementArray.push(structureObj);
                        }
                        user.sendFBMessageTypeStructureMessage(elementArray);
                        // nếu lớn hơn 10  thì mới paging
                        if (rows.length > 10) {
                            setTimeout(function () {
                                var pagingButton = util.createItemOfStructureButton(config.PAGING_BUTTON, user);
                                user.sendFBMessageTypeButtonTemplate(pagingButton, "Bạn có muốn tiếp tục xem những món mới không :D");
                            }, 5000);
                        }
                    } else {
                        user.setStatusCode(404);
                        var responseText = "Chân thành xin lỗi! Địa điểm bạn tìm hiện tại không có!";
                        user.sendFBMessageTypeText(responseText);
                    }
                }
            });
        }
    }
}