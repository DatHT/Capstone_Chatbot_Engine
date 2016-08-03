var config = require('../../../../common/app-config').config;
var responseFilter = require('./../../../../common/FilterResponse');
var databaseConnection = require('../../../DBManager/Database');

module.exports = {
    getCurrentSenderInformation: (user => {
        user.getSenderInformation((response) => {
            console.log(response);
            var profile = JSON.parse(response);
            user.setStatusCode(200);
            var responseText = responseFilter.randomGreetingMessageFilterResponse(profile);
            console.log(responseText);
            var elementArray = [{
                type: "postback",
                title: "Món ăn xu hướng mới",
                payload: JSON.stringify({
                    type: "trend",
                    typeTrend: "food"})
            },{
                type: "postback",
                title: "Quán được nổi nhất",
                payload: JSON.stringify({
                    type: "trend",
                    typeTrend: "location"})
            }, {
                type: "postback",
                title: "Thêm...",
                payload: JSON.stringify({
                    type: "more",
                    typeMore : "more_function"
                })
            }];
            user.sendFBMessageTypeButtonTemplate(elementArray, responseText);
            var gender = (profile.gender === "male") ? 1 : 0;
            var sql = 'insert into facebookuser values ("' + user.getSenderID() + '","' + profile.first_name + '",' + gender + ',' + 0 + ',"' + profile.last_name + '","' + profile.locale + '")';
            databaseConnection.connectToDatabase(sql, function () {
                console.log("save 1 user success");
            })
        });
    }),

    getCurrentSenderInformationWhenGetStart : (user) => {
        user.getSenderInformation((response) => {
            console.log(response);
            var profile = JSON.parse(response);
            user.setStatusCode(200);
            var responseText = 'Mong ạn có thể giúp tôi hoàn thành 1 số thông tin để giúp bot co thể giúp đỡ bạn tốt hơn';
            var elementArray = [{
                type: "postback",
                title: "OK ",
                payload: JSON.stringify({
                    type: 'get_start',
                    isStart : 'yes'
                })
            }];

            user.sendFBMessageTypeButtonTemplate(elementArray, responseText);
            var gender = (profile.gender === "male") ? 1 : 0;

            user.setGender(gender);
            user.setFirstname(profile.first_name);
            user.setLastname(profile.last_name);
            user.setLocale(profile.locale);
        });
    }
};



