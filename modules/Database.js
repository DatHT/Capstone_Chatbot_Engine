/**
 * Created by DatHTSE61273 on 5/18/16.
 */
'use strict'
const mysql = require('mysql');
var config = require('../common/app-config').config;

module.exports = {

    connectToDatabase: connectToDatabase,
    queryMultipleSQLStatements: queryMultipleSQLStatements,
    getProductWithoutAnything: getProductWithoutAnything,
    getProductWithOnlyProductName: getProductWithOnlyProductName,
    getProductWithOnlyAddressName: getProductWithOnlyAddressName,
    getProductWithProductNameAndAddressName: getProductWithProductNameAndAddressName,
    updateNumberOfSearchProductAddress: updateNumberOfSearchProductAddress
}

// private api
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

function getProductWithoutAnything(callback) {
    var sql = 'select * from product_address order by rate desc';
    connectToDatabase(sql, (rows, err) => {
        return callback(rows, err);
    });
}

function getProductWithOnlyProductName(productName, callback) {
    var sql = 'select * from product_address where productName regexp "' + productName + '" order by rate desc';
    connectToDatabase(sql, (rows, err) => {
        return callback(rows, err);
    });
}

function getProductWithOnlyAddressName(addressName, callback) {
    var sql = 'select * from product_address where addressName regexp "' + addressName + '" order by rate desc';
    connectToDatabase(sql, (rows, err) => {
        return callback(rows, err);
    });
}

function getProductWithProductNameAndAddressName(productName, addressName, callback) {
    var sql = 'select * from product_address where productName regexp "' + productName + '" and addressName regexp "' + addressName + '" order by rate desc';
    connectToDatabase(sql, (rows, err) => {
        return callback(rows, err);
    });
}

//get number of search product

