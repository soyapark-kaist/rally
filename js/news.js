$(window).scroll(function() {
    var scroll = $(window).scrollTop();
    var padding = scroll > 30 ? 0 : 30 - scroll;
    $(".timeline-progress ul").css("padding-top", padding);
})

var LOGIN = false,
    USERID = '',
    USERNAME = '',
    EMAIL = '';

$(function() {
    // Show loading spinner
    toggleLoading(".loading");

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

    /* Flow: fb sdk install -> check login status -> fetch comments from DB then append and bind events */
});

function fetchComments() {
    var commentsRef = firebase.database().ref('news/comments');
    commentsRef.once("value").then(function(snapshot) {
        var news_json = snapshot.val(); // data is here
        append_nested_comment("nested-comment", news_json);
        fetchUserLog();

        toggleLoading(".loading");
    });
}

function fetchUserLog() {
    var userRef = firebase.database().ref('news/like/' + USERID);
    userRef.once("value").then(function(snapshot) {
        var user_json = snapshot.val(); // data is here

        for (var l in user_json) {
            $(".comment-" + l + " .fa-chevron-up").addClass("active");
        }
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

function getLogin() { return LOGIN; }

function setLogin(inVal) { LOGIN = inVal; }

// This function is called when someone finishes with the Login
// Button.  See the onlogin handler attached to it in the sample
// code below.
function checkLoginState(param1) {
    FB.getLoginStatus(function(response) {
        checkLoginStateCallback(response, param1);
    });
}

// This is called to get fb Login Status.
function checkLoginStateCallback(response) {
    console.log('statusChangeCallback');
    // The response object is returned with a status field that lets the
    // app know the current login status of the person.
    // Full docs on the response object can be found in the documentation
    // for FB.getLoginStatus().
    if (response.status === 'connected') {
        // Logged into your app and Facebook.
        setLogin(true);
        FB.api('/me', {
            locale: 'en_US',
            fields: 'email,name'
        }, function(response) {
            console.log('Successful login for: ' + response.name);
            USERID = response.id;
            USERNAME = response.name;
            EMAIL = response.email;

            init_comments();
        });
    } else {
        setLogin(false);
        init_comments();
    }
}

function add_reply(clicked_reply) {
    $("#like").remove();
    var $reply_html = $(get_reply_html());
    $media_body = $(clicked_reply).parent();
    $media_body.append($reply_html);

    //Suggest login only when the user is not currently logged in
    if (!getLogin())
        init_popover($reply_html.find(".comments-post"));
}

function add_root_reply() {
    $("#like").remove();
    var $reply_html = $(get_reply_html(1));
    $reply_html.attr("id", "root-like");
    $reply_html.find(".postfix-icon").attr("id", "root-like-postfix");
    $("#nested-comment").after($reply_html);

    //Suggest login only when the user is not currently logged in
    if (!getLogin())
        init_popover($reply_html.find(".comments-post"));
}

function init_popover($x) {
    var popover_html =
        '<a href="javascript:void(0);" onclick="fbLogin()"><i class="fa fa-facebook fa-2x" aria-hidden="true"></i></a>' +
        '<i class="fa fa-google fa-2x" aria-hidden="true"></i>' +
        '<i class="fa fa-twitter fa-2x" aria-hidden="true"></i>'
    $x.popover({
        html: true,
        content: popover_html,
        title: '로그인',
        delay: { show: 0, hide: 250 },
    });
}

function init_comments() {
    fetchComments();

    /* Bind reply-addition event */
    add_root_reply();
    $("body").on("click", ".fa-reply", function() {
        add_reply(this);
    });
    $(".content").click(function(e) {
        if ($(e.target).parents("#like").length == 0 &&
            !$(e.target).is("#like")) {
            $("#like").remove();
        }
    });

    /* Bind like(vote) event */
    $("body").on("click", ".fa.fa-chevron-up", function() {
        var like_num = 0;
        /* If it's alreay up voted, cancel and decrement the vote. */
        if ($(this).hasClass("active")) { // cancel vote
            /* dehighlight color */
            $(this).removeClass("active");

            /* decrement */
            $(this).text(parseInt($(this).text().replace(" ", "")) - 1);

            like_num = -1;
        } else { // up vote
            /* highlight color */
            $(this).addClass("active");

            /* increment */
            $(this).text(parseInt($(this).text().replace(" ", "")) + 1);

            like_num = 1;
        }

        var parent_id,
            comment_id;

        // if the comment is root
        if ($(this).parent().attr("id").split("_").length == 2) parent_id = '', comment_id = $(this).parent().attr("id").split("_")[1];
        else parent_id = $(this).parent().attr("id").split("_")[1],
            comment_id = $(this).parent().attr("id").split("_")[2];

        // Check whether the user is authenticated at firebase
        var user = firebase.auth().currentUser;
        if (!user) {
            firebase.auth().signInAnonymously().then(function(user) {
                postVote(comment_id, parent_id, like_num);
            });
        } else postVote(comment_id, parent_id, like_num);

    });

    /* Bind seemore event */
    $("body").on("click", ".seemore-btn", function() {
        var media_body_id = $(this).attr("id").replace("seemore-", "");
        $("#" + media_body_id).find(".media").show();
        $(this).remove();
    })

    /* Bind comment category event */
    $('a[data-toggle="pill"]').on('shown.bs.tab', function(e) {
        var target = $(e.target).attr("value") // activated tab

        //if all panel is on
        if (!target)
            $(".media").show();
        else {
            $(".media").hide();
            $(".comment-" + target).show();
        }

    });

    $("body").on("click", ".comment-add-report", function() {
        var uRef = firebase.database().ref("news/report/" + firebase.auth().currentUser.uid);
        uRef.once("value").then(function(snapshot) {
            var report = snapshot.val(); // bldg/activity/OS/ping/down/up

            if (!report) console.log("suggest to report now!");

            $(this).parent().find(".report-display").append("<p>최근 제보 내용이 있다면 여기 추가될 것" + '<button onclick="this.parentElement.remove()" type="button" class="close" aria-label="Close"><span aria-hidden="true">&times;</span></button></p>');
        });

    });
}

function postVote(inCommentID, inParentID, inLikeNum) { // inLikeNum 1 when upvote, -1 when down vote
    var pRef = firebase.database().ref("news/comments/" + (inParentID ? inParentID + "/comments/" + inCommentID : inCommentID) + "/like");
    pRef.transaction(function(searches) {
        return (searches || 0) + inLikeNum;
    });

    var uRef = firebase.database().ref("news/like/" + (USERID ? USERID : firebase.auth().currentUser.uid) + "/" + inCommentID);
    if (inLikeNum == 1)
        uRef.set(true,
            function(error) {
                if (error) {
                    console.log(error);
                } else { // if successfully posted a new comments clear textarea and turn off loading spinner. 

                }

            });

    else uRef.remove();
}

/* post a new comment to DB. */
function postComment(inElement) {
    if (!LOGIN) return; // check fb authentication

    // Check whether the user is authenticated at firebase
    var user = firebase.auth().currentUser;
    if (!user) {
        firebase.auth().signInAnonymously().then(function(user) {
            postCommentCallback(inElement);
        });
    } else postCommentCallback(inElement);
}

function postCommentCallback(inElement) {
    // turn on loading spinner. 
    toggleLoading(".loading");

    var new_comment_elem = inElement.parentElement.parentElement,
        content = new_comment_elem.getElementsByClassName("status-box")[0].value,
        parent_id = '';
    // if a new comment is root comment
    if (new_comment_elem.id == "root-like") {}
    // if a new comment has a parent
    else { parent_id = new_comment_elem.parentElement.id.split("comment_")[1]; }
    debugger;
    console.log(USERNAME, EMAIL, content);

    var playersRef = firebase.database().ref("news/comments/" + (parent_id ? parent_id + "/comments/" : "") + generateID(8)); /* UID for a new comments. */

    playersRef.set({
            "type": $("input[name='comment-type']:checked").attr("value"),
            "content": content,
            "time": new Date().toString(),
            "email": EMAIL + "/rally/" + USERNAME,
            "like": 0,
            "dislike": 0
        },
        function(error) {
            if (error) {
                console.log(error);
            } else { // if successfully posted a new comments clear textarea and turn off loading spinner. 
                new_comment_elem.getElementsByClassName("status-box")[0].value = "";
                toggleLoading(".loading");
            }

        });
}

function get_reply_html(type) {
    var postfix;
    if (type == 0) {
        postfix = "fa-exclamation"
    } else if (type == 1) {
        postfix = "fa-question"
    }
    var reply_html =
        '<div id="like">' +
        '<form class="form-inline"><div class="form-group">' +
        '<label class="radio-inline">' +
        '<input type="radio" value="0" name="comment-type" id="comment-question" value="comment-question" checked> 질문' +
        '</label>' +
        '<label class="radio-inline">' +
        '<input type="radio" value="1" name="comment-type" id="comment-suggestion" value="comment-suggestion"> 제안' +
        '</label>' +
        '<label class="radio-inline">' +
        '<input type="radio" value="2" name="comment-type" id="comment-else" value="comment-else"> 그 외' +
        '</label>' +
        '</div></form>' +
        '<form style="margin-top: 10px;">' +
        '<span class="form-inline">' +
        '<label for="comment-to"><i class="fa fa-paper-plane-o" aria-hidden="true"></i></label>' +
        '<input type="text" class="form-control" id="comment-to" placeholder="아무나">' +
        '<i id="like-postfix" class="postfix-icon fa fa-3x ' + postfix + '" aria-hidden="true"></i>' +
        '</span>' +
        '<p class="comment-add-report">+ 내 최근 제보 추가하기</p>' +
        '<div class="report-display"></div>' +
        '<div class="form-group">' +
        '<textarea class="form-control status-box" onkeyup="countLetter(this)" rows="2"></textarea>' +
        '</div>' +
        '</form>' +
        '<div class="button-group" style="text-align:right">' +
        '<p class="counter">140</p>' +
        '<a class="btn btn-primary comments-post like-comment disabled" onclick="postComment(this)" tabindex="0" data-container="body" ' +
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
    var title = c_news_json.email.substring(0, 3) + "****";
    var content = c_news_json.content;

    /* Build comment html */
    var html =
        '<li class="media comment-' + getClassPostfix(c_news_json.type) + ' ">' +
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
        '<div id=' + 'comment-' + new_id + ' class=' + 'comment-' + cid + '>' +
        '<p>' + content + '</p>' +
        '<i class="fa fa-reply" aria-hidden="true"></i>' +
        '<i class="fa fa-chevron-up" aria-hidden="true"> ' + c_news_json.like + '</i>' +
        // '<i class="fa fa-chevron-down" aria-hidden="true"> ' + c_news_json.dislike + '</i>' +
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

function getClassPostfix(type) {
    if (type == 0) {
        return "suggest"
    } else if (type == 1) {
        return "question"
    } else {
        return "comment"
    }
}

function is_key(obj, key) {
    return (Object.keys(obj).indexOf(key.toString()) !== -1);
}