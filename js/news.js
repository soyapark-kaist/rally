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

    /* Build nested-comment */
    fetchComments();

    /* Bind reply-addition event */
    add_root_reply();
    $("body").on("click", ".fa-reply", function() {
        add_reply(this);
    });
    $(".content").click(function(e) {
        if ($(e.target).parents("#like").length == 0) {
            $("#like").remove();
        }
    });

    /* Bind seemore event */
    $("body").on("click", ".seemore-btn", function() {
        var media_body_id = $(this).attr("id").replace("seemore-", "");
        $("#" + media_body_id).find(".media").show();
        $(this).remove();
    })
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

function countLetter(inElement) {
    var postLength = inElement.textLength;
    var charactersLeft = 140 - postLength;
    inElement.getElementsByClassName("status-box");

    inElement.parentElement.parentElement.parentElement.getElementsByClassName("counter")[0].innerHTML = charactersLeft;

    if (charactersLeft < 0) {
        inElement.parentElement.parentElement.parentElement.getElementsByClassName("comments-post")[0].classList += " disabled";
    } else if (charactersLeft == 140) {
        inElement.parentElement.parentElement.parentElement.getElementsByClassName("comments-post")[0].classList += " disabled";
    } else {
        inElement.parentElement.parentElement.parentElement.getElementsByClassName("comments-post")[0].classList.remove("disabled");
    }
}

function add_reply(clicked_reply) {
    $("#like").remove();
    var $reply_html = $(get_reply_html());
    $media_body = $(clicked_reply).parent();
    $media_body.append($reply_html);
    init_popover($reply_html.find(".comments-post"));
}

function add_root_reply() {
    $("#like").remove();
    var $reply_html = $(get_reply_html());
    $reply_html.attr("id", "root-like");
    $("#nested-comment").after($reply_html);
    init_popover($reply_html.find(".comments-post"));
}

function init_popover($x) {
    var popover_html =
        '<i class="fa fa-facebook fa-2x" aria-hidden="true"></i>' +
        '<i class="fa fa-google fa-2x" aria-hidden="true"></i>' +
        '<i class="fa fa-twitter fa-2x" aria-hidden="true"></i>'
    $x.popover({
        html: true,
        content: popover_html,
        title: '로그인',
        delay: { show: 0, hide: 250 },
    });
}

function get_reply_html() {
    var reply_html =
        '<div id="like">' +
        '<form class="form-inline"><div class="form-group">' +
        '<label class="radio-inline">' +
        '<input type="radio" name="comment-type" id="comment-question" value="comment-question" checked> 질문' +
        '</label>' +
        '<label class="radio-inline">' +
        '<input type="radio" name="comment-type" id="comment-suggestion" value="comment-suggestion"> 제안' +
        '</label>' +
        '<label class="radio-inline">' +
        '<input type="radio" name="comment-type" id="comment-else" value="comment-else"> 그 외' +
        '</label>' +
        '</div></form>' +
        '<form style="margin-top: 10px;">' +
        '<span class="form-inline" style="margin-left: 14px;">' +
        '<label for="comment-to"><i class="fa fa-paper-plane-o" aria-hidden="true"></i></label>' +
        '<input type="text" class="form-control" id="comment-to" placeholder="아무나">' +
        '</span>' +
        '<div class="form-group">' +
        '<textarea class="form-control status-box" onkeyup="countLetter(this)" rows="2"></textarea>' +
        '</div>' +
        '</form>' +
        '<div class="button-group" style="text-align:right">' +
        '<p class="counter">140</p>' +
        '<a class="btn btn-primary comments-post like-comment disabled" tabindex="0" data-container="body" ' +
        'data-toggle="popover" data-trigger="focus" data-placement="top">Post</a>' +
        '</div>' +
        '</div>';

    return reply_html;
}

/* @param {string} nc_id - id of root node. must be <ul>
@param {object} news_json - object from database
Traverse news_json and append recursively comments
which has "content" key */
function append_nested_comment(nc_id, news_json) {
    /* deep copy */
    var c_news_json = $.extend(true, {}, news_json);
    /* traversal */
    for (var key in c_news_json) {
        /* if is_comment: append comment */
        if (is_key(c_news_json[key], "content")) {
            append_comment_html(nc_id, key, c_news_json[key]);
        }
        /* if is_leaf: break; */
        if (typeof(c_news_json[key]) != "object") {
            break;
        }
        /* Recursive call to child json */
        var parent_id = (key != "comments") ? nc_id + "_" + key : nc_id;
        append_nested_comment(parent_id, c_news_json[key])
    }
}

function append_comment_html(parent_id, cid, news_json) {
    var c_news_json = $.extend(true, {}, news_json);
    var new_id = parent_id + "_" + cid;
    var $parent = $(document.getElementById(parent_id));

    var icon = get_comment_icon(c_news_json.type);
    var title = c_news_json.email;
    var content = c_news_json.content;

    /* Build comment html */
    var html =
        '<li class="media">' +
        '<div class="media-left">' +
        '<i class="fa fa-2x ' + icon + '" aria-hidden="true"></i>' +
        '</div>' +
        '<div class="media-body" id=' + new_id + '>' +
        '<p class="media-heading">' +
        title +
        '<span class="comment-date"> · ' +
        c_news_json.time.replace("T", " ") +
        '</span>' +
        '</p>' +
        '<div id=' + 'comment-' + new_id + '>' +
        '<p>' + content + '</p>' +
        '<i class="fa fa-reply" aria-hidden="true"></i>' +
        '<i class="fa fa-chevron-up" aria-hidden="true"> ' + c_news_json.like + '</i>' +
        '<i class="fa fa-chevron-down" aria-hidden="true"> ' + c_news_json.dislike + '</i>' +
        '</div>' +
        '</div>' +
        '</li>';
    var $html = $(html);

    /* Append html */
    if (is_key(c_news_json, "comments") &&
        $parent.is("ul") /*is root*/ ) {
        var see_more_html =
            '<p class="seemore-btn" id="seemore-' + new_id + '">' +
            '<i class="fa fa-caret-down" aria-hidden="true"></i>' +
            ' 답글 더 보기' +
            '</p>';
        $html.find(".media-body").append($(see_more_html));
    } else if (!$parent.is("ul")) {
        $html.hide();
    }
    $parent.append($html);
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