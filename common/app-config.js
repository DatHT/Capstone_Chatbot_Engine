/**
 * Created by HuyTCM on 5/21/16.
 */
var fs = require('fs');
var configFile = "common/config.json";

module.exports = JSON.parse(fs.readFileSync(configFile));