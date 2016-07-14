
var util = require('../common/CommonUtil');

function createProductAddress(dataArray) {
    return new ProductAddress(dataArray);
}

module.exports = createProductAddress;

function ProductAddress(dataArray) {
    this.dataArray = dataArray || [];
}


ProductAddress.prototype = {

    hydrate: function () {
        var memento = JSON.stringify(this);
        return memento;
    },

    dehydrate: function (dataArray) {
        var m = JSON.parse(dataArray);
        return this.dataArray = m.dataArray;

    }
}