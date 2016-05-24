/**
 * Created by HuyTCM on 5/21/16.
 */
var fs = require('fs');
var configFilePath = __dirname + "/config.json";

exports.config = JSON.parse(fs.readFileSync(configFilePath));