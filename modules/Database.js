/**
 * Created by DatHTSE61273 on 5/18/16.
 */
'use strict'
const mysql = require('mysql');
var config = require('../common/app-config').config;

module.exports = {

    connectToDatabase: connectToDatabase,
    queryMultipleSQLStatements: queryMultipleSQLStatements
}
function connectToDatabase(sql, callback) {
    var connection = mysql.createConnection({
        host: config.DBManager.connection.host,
        user: config.DBManager.connection.user,
        password: config.DBManager.connection.password,
        database: config.DBManager.connection.database,
    });
    connection.connect();
    connection.query(sql, function (err, rows, fields) {
        if (err) return new Error("Error: " + err);
        return callback(rows, err);

    });

    connection.end();
}

function queryMultipleSQLStatements(sql, callback) {
    var connection = mysql.createConnection({
        host: config.DBManager.connection.host,
        user: config.DBManager.connection.user,
        password: config.DBManager.connection.password,
        database: config.DBManager.connection.database,
        multipleStatements: true
    });
    connection.connect();
    connection.query(sql, function (err, rows, fields) {
        if (err) return new Error("Error: " + err);
        return callback(rows[1], err);

    });

    connection.end();
}

// public API
function updateNumberOfSearchProductAddress(item, callback) {
    var sql = 'update product_address ' +
        'set numOfSearch =' + item.numOfSearch +
        'where productId = "' + item.productId + '" and addressId = "' + item.addressId + '"';
    connectToDatabase(sql, (rows, err) => {
        return callback(rows, err)
    });
}

//get number of search product

