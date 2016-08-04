/**
 * Created by DatHTSE61273 on 5/18/16.
 */
'use strict';
const mysql = require('mysql');
var config = require('../../common/app-config').config;

module.exports = {

    connectToDatabase: connectToDatabase,
    queryMultipleSQLStatements: queryMultipleSQLStatements,
    getProductWithoutAnything: getProductWithoutAnything,
    getProductWithOnlyProductName: getProductWithOnlyProductName,
    getProductWithOnlyAddressName: getProductWithOnlyAddressName,
    getProductWithProductNameAndAddressName: getProductWithProductNameAndAddressName,
    updateNumberOfSearchProductAddress: updateNumberOfSearchProductAddress,
    getCoordinateWithAddress: getCoordinateWithAddress,
    getProductNearbyWithProductNameAndAddressName: getProductNearbyWithProductNameAndAddressName,
    getProductNearbyWithOnlyAddressname: getProductNearbyWithOnlyAddressname,
    checkoFoodExisted :checkoFoodExisted

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
    var sql = 'update productdetail ' +
        'set numOfSearch =' + item.numOfSearch +
        ' where productId = "' + item.productId + '" and addressId = "' + item.addressId + '"';
    console.log("LOG: SQL = ", sql);
    connectToDatabase(sql, (rows, err) => {
        return callback(rows, err)
    });
}

function getProductWithoutAnything(callback) {
    var sql = 'select * from productdetail order by rate desc';
    console.log("LOG: SQL = ", sql);
    connectToDatabase(sql, (rows, err) => {
        return callback(rows, err);
    });
}

function getProductWithOnlyProductName(productName, callback) {
    var sql = 'select * from productdetail where productName regexp "' + productName + '" order by rate desc';
    console.log("LOG: SQL = ", sql);
    connectToDatabase(sql, (rows, err) => {
        return callback(rows, err);
    });
}

function getProductWithOnlyAddressName(addressName, callback) {
    var sql = 'select * from productdetail where addressName regexp "' + addressName + '" order by rate desc';
    console.log("LOG: SQL = ", sql);
    connectToDatabase(sql, (rows, err) => {
        return callback(rows, err);
    });
}

function getProductWithProductNameAndAddressName(productName, addressName, callback) {
    var sql = 'select * from productdetail where productName regexp "' + productName + '" and addressName regexp "' + addressName + '" order by rate desc';
    console.log("LOG: SQL = ", sql);
    connectToDatabase(sql, (rows, err) => {
        return callback(rows, err);
    });
}

function getCoordinateWithAddress(addressName, callback) {
    var sql = 'select * from productdetail where addressName regexp "' + addressName + '"';
    console.log("LOG: SQL = ", sql);
    connectToDatabase(sql, (rows, err) => {
        return callback(rows, err);
    });
}

function getProductNearbyWithProductNameAndAddressName(productName, addressName, callback) {
    var sql = createQueryNearbyWithProductAndLocation(productName, addressName);
    connectToDatabase(sql, (rows, err) => {
        return callback(rows, err);
    })
}

function getProductNearbyWithOnlyAddressname(addressName, callback) {
    var sql = createQueryNearbyWithOnlyLocation(addressName);
    connectToDatabase(sql, (rows, err) => {
        return callback(rows, err);
    })
}

function setParamAddressName(location) {
    switch (location) {
        case (config.districts.district_1.name) :
        {
            return getMultipleDistrict(config.districts.district_1.nearby);
        }
        case (config.districts.district_2.name) :
        {
            return getMultipleDistrict(config.districts.district_2.nearby);
        }
        case (config.districts.district_3.name) :
        {
            return getMultipleDistrict(config.districts.district_3.nearby);
        }
        case (config.districts.district_4.name) :
        {
            return getMultipleDistrict(config.districts.district_4.nearby);
        }
        case (config.districts.district_5.name) :
        {
            return getMultipleDistrict(config.districts.district_5.nearby);
        }
        case (config.districts.district_6.name) :
        {
            return getMultipleDistrict(config.districts.district_6.nearby);
        }
        case (config.districts.district_7.name) :
        {
            return getMultipleDistrict(config.districts.district_7.nearby);
        }
        case (config.districts.district_8.name) :
        {
            return getMultipleDistrict(config.districts.district_8.nearby);
        }
        case (config.districts.district_9.name) :
        {
            return getMultipleDistrict(config.districts.district_9.nearby);
        }
        case (config.districts.district_10.name) :
        {
            return getMultipleDistrict(config.districts.district_10.nearby);
        }
        case (config.districts.district_11.name) :
        {
            return getMultipleDistrict(config.districts.district_11.nearby);
        }
        case (config.districts.district_12.name) :
        {
            return getMultipleDistrict(config.districts.district_12.nearby);
        }
        case (config.districts.district_tan_phu.name) :
        {
            return getMultipleDistrict(config.districts.district_tan_phu.nearby);
        }
        case (config.districts.district_tan_binh.name) :
        {
            return getMultipleDistrict(config.districts.district_tan_binh.nearby);
        }
        case (config.districts.district_go_vap.name) :
        {
            return getMultipleDistrict(config.districts.district_go_vap.nearby);
        }
        case (config.districts.district_binh_thanh.name) :
        {
            return getMultipleDistrict(config.districts.district_binh_thanh.nearby);
        }
        case (config.districts.district_binh_tan.name) :
        {
            return getMultipleDistrict(config.districts.district_binh_tan.nearby);
        }
        case (config.districts.district_phu_nhuan.name) :
        {
            return getMultipleDistrict(config.districts.district_phu_nhuan.nearby);
        }
        default:
        {
            console.log('do not match any district');
            break;
        }
    }
}

function createQueryNearbyWithProductAndLocation(product, location) {
    var sql = 'select * from productdetail where productName regexp "' + product + '" and ' + setParamAddressName(location) + ' order by rate desc ';
    console.log("LOG: SQL = ", sql);
    return sql;
}

function createQueryNearbyWithOnlyLocation(location) {
    var sql = 'select * from productdetail where ' + setParamAddressName(location) + ' order by rate desc ';
    console.log("LOG: SQL = ", sql);
    return sql;

}

function getMultipleDistrict(districts) {
    var tmpAddressName = '(';
    for (var i = 0; i < districts.length; i++) {
        tmpAddressName += 'addressName regexp "' + districts[i] + '" ';
        if (i < districts.length-1) {
            tmpAddressName += 'or ';
        } else {
            tmpAddressName +=') ';
        }
    }
    return tmpAddressName;
}

function checkUserProfileExisted(senderId, callback) {
    var sql = '';
    console.log("LOG: SQL = ", sql);
    connectToDatabase(sql, (rows, err) => {
        return callback(rows, err);
    })
}

function checkoFoodExisted(food, callback) {
    var sql = 'select * from productdetail where productName regexp "' + food + '"';
    connectToDatabase(sql, (rows, err) => {
        return callback(rows, err);
    });
}