/**
 * Created by ThanhTV0612 on 6/7/16.
 */
var config = require('../common/app-config').config;

var thanks = ["Cảm ơn bạn đã quan tâm tới Bot đẹp trai :D",
                    "Lần sau bạn lại ghé thăm tui nhé :3",
                    "Khi nào đói thì cứ tìm tui nhé =))"];

var regretNoProduct = ["Xin lỗi nha :( Món này hiện tại không tìm được",
                        "Chán quá :( Món này giờ tìm hoài không thấy",
                        "Tìm mãi không đươc bạn ơi ~~ Bạn tìm món khác được không :(",
                        "Hic! Món này tui tìm không thấy bạn ơi"];
var regretNoRestaurant = ["Xin lỗi nha :( Chỗ này này hiện tại không tìm được",
    "Chán quá :( Chỗ này tui tìm nãy giờ  không thấy",
    "Tìm không thấy chỗ này bạn ơi ~~ Bạn tìm món khác được không :(",
    "Hic! Chỗ này tui tìm không thấy bạn ơi"];

var requestPersonalLocation = ["Bạn có thể chia sẻ địa điểm chính xác của bạn cho tôi được không?",
    "Hiện tại bạn đang ở chỗ nào vậy :D Có thể share vị trí cho tui được không",
    "Cho tui biết chính xác địa điểm của bạn ở chỗ nào đi :D"];

var requestLocation = ["Bạn có thể cho tôi biết rõ bạn muốn ăn ở đâu"];

var nextItem = ["Bạn có muốn tiếp tục xem những món mới không :D", "Vẫn còn nhiều món lắm! Bạn có muốn xem nữa không"];

module.exports = {
    randomThanksResponse : randomThanksResponse(),
    randomRegretNoProductResponse : randomRegretNoProductResponse(),
    randomRegretNoRestaurantResponse : randomRegretNoRestaurantResponse(),
    randomRequestPersonalLocationResponse : randomRequestPersonalLocationResponse(),
    randomRequestLocationResponse : randomRequestLocationResponse(),
    randomNextItemResponse : randomNextItemResponse()
}

function randomThanksResponse() {
    var rdValue = Math.floor(Math.random() * (thanksReponse.length + 1));
    return thanks[rdValue];
}

function randomRegretNoProductResponse() {
    var rdValue = Math.floor(Math.random() * (regretNoProduct.length + 1));
    return regretNoProduct[rdValue];
}

function randomRegretNoRestaurantResponse() {
    var rdValue = Math.floor(Math.random() * (regretNoRestaurant.length + 1));
    return regretNoRestaurant[rdValue];
}

function randomRequestPersonalLocationResponse() {
    var rdValue = Math.floor(Math.random() * (requestPersonalLocation.length + 1));
    return requestPersonalLocation[rdValue];
}

function randomRequestLocationResponse() {
    var rdValue = Math.floor(Math.random() * (requestLocation.length + 1));
    return requestLocation[rdValue];
}

function randomNextItemResponse() {
    var rdValue = Math.floor(Math.random() * (nextItem.length + 1));
    return nextItem[rdValue];
}