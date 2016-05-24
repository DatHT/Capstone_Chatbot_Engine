/**
 * Created by HuyTCM on 5/21/16.
 */
var fs = require('fs');
var configFilePath = __dirname + "/config.json";

module.exports = JSON.parse(fs.readFileSync(configFilePath));