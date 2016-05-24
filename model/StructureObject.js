/**
 * Created by DatHT on 5/21/2016.
 */
'use strict'

var structureObj = {
    title: "",
    image_url: "",
    subtitle: "",
    buttons:[
        {
            type: "web_url",
            url: "https://petersapparel.parseapp.com/view_item?item_id=100",
            title: "Xem chi tiết"
        },{
            type: "web_url",
            url: "https://petersapparel.parseapp.com/view_item?item_id=100",
            title: "Xem cái chi"
        },{
            type:"postback",
            title:"Xem giá",
            payload:"Payload for first element in a generic bubble"
        }

        ]
};


module.exports = structureObj;