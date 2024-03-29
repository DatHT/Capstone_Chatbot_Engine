/**
 * Created by HuyTCM on 6/1/16.
 */
var fs = require('fs');
var path = require('path');

module.exports = (sender, code, response) => {
    "use strict";
    console.log('do write log');
    var date = new Date();
    var dateString = getDateString(date);

    var logsPath = path.dirname(require.main.filename) + "/" + dateString;
    fs.exists(logsPath, function (result) {
        if (result) {
            writeLog(logsPath);
        } else {
            fs.mkdir(logsPath, writeLog(logsPath));
        }
    });
    function writeLog(path) {
        var filePath = path + "/" + sender;
        var data;

        if (code) {
            data = ">>>>>          " + code + "         <<<<<=============\n" +
                JSON.stringify(response, null, 2) +
                "\n<<<<<" + code + "\n";
        }

        fs.exists(filePath, function (result) {
            if (result) {
                fs.appendFileSync(filePath, data);
            } else {
                fs.writeFileSync(filePath, data);
            }
        });
    }
};
function getDateString(date) {
    var fullDate = date.getDate() > 9 ? date.getDate() : '0' + date.getDate();
    var fullMonth = date.getMonth() > 8 ? date.getMonth() + 1 : '0' + (date.getMonth() + 1);
    var dateString = date.getFullYear() + fullMonth + fullDate;

    return dateString;
}