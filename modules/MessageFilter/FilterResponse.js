/**
 * Created by ThanhTV0612 on 6/7/16.
 */
var config = require('../../common/app-config').config;

var obligingFilter = ["Cảm ơn bạn đã quan tâm tới Bot đẹp trai :D",
                    "Lần sau bạn lại ghé thăm tui nhé :3",
                    "Khi nào đói thì cứ tìm tui nhé =))"];

var regretProductNotFoundFilter = ["Xin lỗi nha :( Món này hiện tại không tìm được",
                        "Chán quá :( Món này giờ tìm hoài không thấy",
                        "Tìm mãi không đươc bạn ơi ~~ Bạn tìm món khác được không :(",
                        "Hic! Món này tui tìm không thấy bạn ơi"];
var regretRestaurantNotFoundFilter = ["Xin lỗi nha :( Chỗ này này hiện tại không tìm được",
    "Chán quá :( Chỗ này tui tìm nãy giờ  không thấy",
    "Tìm không thấy chỗ này bạn ơi ~~ Bạn tìm món khác được không :(",
    "Hic! Chỗ này tui tìm không thấy bạn ơi"];

var requestPersonalLocationFilter = ["Bạn có thể chia sẻ địa điểm chính xác của bạn cho tôi được không?",
    "Hiện tại bạn đang ở chỗ nào vậy :D Có thể share vị trí cho tui được không",
    "Cho tui biết chính xác địa điểm của bạn ở chỗ nào đi :D"];

var requestLocationFilter = ["Bạn có thể cho tôi biết rõ bạn muốn ăn ở đâu"];

var pagingFilter = ["Bạn có muốn tiếp tục xem những món mới không :D", "Vẫn còn nhiều món lắm! Bạn có muốn xem nữa không"];

var reportResponseFilter = ["Cảm ơn bạn đã report món lỗi của bot :D", "Cảm ơn bạn đã góp phần làm cho bot thông minh hơn", "Cảm ơn sự giúp đỡ của bạn!"];

module.exports = {
    randomReportResponseFilterResponse : randomReportResponseFilterResponse(),
    randomObligingFilterResponse : randomObligingFilterResponse(),
    randomRegretProductNotFoundFilterResponse : randomRegretProductNotFoundFilterResponse(),
    randomRegretRestaurantNotFoundFilterResponse : randomRegretRestaurantNotFoundFilterResponse(),
    randomRequestPersonalLocationFilterFilterResponse : randomRequestPersonalLocationFilterResponse(),
    randomRequestLocationFilterResponse : randomRequestLocationFilterResponse(),
    randomPagingFilterResponse : randomPagingFilterResponse(),
    randomGreetingMessageFilterResponse: (profile => {
        var greetingMessageFilter = [`Chào ${profile.last_name} ${profile.first_name}! Tôi có thể giúp gì cho bạn :D`,
            `Xin chào ${profile.last_name} ${profile.first_name}! Tôi rất vui khi có thể giúp bạn tìm món ăn ngon :D`];
        var rdValue = Math.floor(Math.random() * (greetingMessageFilter.length));
        return greetingMessageFilter[rdValue];
    })
}

function randomObligingFilterResponse() {
    var rdValue = Math.floor(Math.random() * (obligingFilter.length ));
    return obligingFilter[rdValue];
}

function randomRegretProductNotFoundFilterResponse() {
    var rdValue = Math.floor(Math.random() * (regretProductNotFoundFilter.length ));
    return regretProductNotFoundFilter[rdValue];
}

function randomRegretRestaurantNotFoundFilterResponse() {
    var rdValue = Math.floor(Math.random() * (regretRestaurantNotFoundFilter.length));
    return regretRestaurantNotFoundFilter[rdValue];
}

function randomRequestPersonalLocationFilterResponse() {
    var rdValue = Math.floor(Math.random() * (requestPersonalLocationFilter.length ));
    return requestPersonalLocationFilter[rdValue];
}

function randomRequestLocationFilterResponse() {
    var rdValue = Math.floor(Math.random() * (requestLocationFilter.length));
    return requestLocationFilter[rdValue];
}

function randomPagingFilterResponse() {
    var rdValue = Math.floor(Math.random() * (pagingFilter.length));
    return pagingFilter[rdValue];
}

function randomReportResponseFilterResponse() {
    var rdValue = Math.floor(Math.random() * (reportResponseFilter.length));
    return reportResponseFilter[rdValue];
}

