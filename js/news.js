$(window).scroll(function() {
    var scroll = $(window).scrollTop();
    var padding = scroll > 30 ? 0 : 30 - scroll;
    $(".timeline-progress ul").css("padding-top", padding);
})

$(function() {
    initDB();

    $('body').scrollspy({ target: ".timeline-progress", offset: 200 });

    // $('.timeline-progress').scrollspy({
    //     offset: 500
    // });

    var aver_bandwidth = [
        ["세종관", 61, 15.9, 13.6, "wGcNI2L"],
        ["희망관", 41, 34.3, 50.9, "9BaU2z5"],
        ["아름관", 26, 39.0, 45.8, "Q0b0V2W"],
        ["갈릴레이관", 14, 12.4, 15.7, "imZl4og"],
        ["미르관", 13, 12.8, 6.2, "LLJqfXf"]
    ];

    /* Overall stat */
    for (var b in aver_bandwidth) {
        var item = aver_bandwidth[b];

        $(".overall-stat tbody").append(
            '<tr onclick="handleOutboundLinkClicks(this)" href="./timeline.html?id=' + item[4] + '"' + '>\
            <td>' + item[0] + '</td>\
            <td>' + item[1] + '</td>\
            <td>' + item[2] + '</td>\
            <td>' + item[3] + '</td>\
          </tr>'
        );
    }

    $('[data-spy="scroll"]').each(function() {
        var $spy = $(this).scrollspy('refresh')
            // alert();
    })

    $('body').on('activate.bs.scrollspy', function() {
        // do something…
        // console.log("test");
    })

    drawBarChart();
});

function fetchComments() {
    var commentsRef = firebase.database().ref('news/comments');
    commentsRef.once("value").then(function(snapshot) {
        var news_json = snapshot.val(); // data is here
        append_nested_comment("nested-comment", news_json);
    });
}

function handleOutboundLinkClicks(event) {
    ga('send', 'event', 'news', 'click', event.getAttribute("href"), {
        'transport': 'beacon',
        'hitCallback': function() {
            document.location = event.getAttribute("href");
        }
    });
}

$(document).ready(function(){
    fetchComments();
})

/* @param {string} nc_id - id of root node. must be <ul>
@param {object} news_json - object from database
Traverse news_json and append recursively comments
which has "content" key */
function append_nested_comment (nc_id, news_json) {
    /* deep copy */
    var c_news_json = $.extend(true, {}, news_json);
    /* traversal */
    for (var key in c_news_json) {
        /* if is_comment: append comment */
        if(is_key(c_news_json[key], "content")) {
            append_comment_html(nc_id, key, c_news_json[key]);
        }
        /* if is_leaf: break; */
        if(typeof(c_news_json[key]) != "object") {
            break;
        }
        /* Recursive call to child json */
        var parent_id = (key != "comments") ? nc_id + "-" + key : nc_id;
        append_nested_comment (parent_id, c_news_json[key])
    }
}

function append_comment_html (parent_id, cid, news_json) {
    var c_news_json = $.extend(true, {}, news_json);
    var new_id = parent_id + "-" + cid;
    delete c_news_json["comments"];

    var icon = get_comment_icon(c_news_json.type);
    var title = c_news_json.email;
    var content = c_news_json.content;

    /* Build comment html */
    var html =
    '<li class="media">'+
        '<div class="media-left">'+
            '<i class="fa fa-2x ' + icon + '" aria-hidden="true"></i>'+
        '</div>'+
            '<div class="media-body" id=' + new_id + '>'+
            '<p class="media-heading">'+
                title +
                '<span class="comment-date"> · '+
                    c_news_json.time.replace("T", " ")+
                '</span>'+
            '</p>'+
            '<div id=' +'comment-' + new_id + '>'+
                '<p>' + content + '</p>'+
                '<i class="fa fa-reply" aria-hidden="true"></i>'+
                '<i class="fa fa-chevron-up" aria-hidden="true"> ' + c_news_json.like + '</i>'+
                '<i class="fa fa-chevron-down" aria-hidden="true"> '+ c_news_json.dislike +'</i>'+
            '</div>'+
        '</div>'+
    '</li>';
    var $html = $(html);

    /* Append html */
    $(document.getElementById(parent_id)).append($html);
}

function get_comment_icon(type) {
    var icon;
    if (type == 0) {
        icon = "fa-lightbulb-o"
    } else if (type == 1) {
        icon = "fa-question"
    } else {
        icon = "fa-comment-o"
    }
    return icon;
}

function is_key(obj, key) {
    return (Object.keys(obj).indexOf(key.toString()) !== -1);
}
