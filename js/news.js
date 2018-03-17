$(window).scroll(function() {
    var scroll = $(window).scrollTop();
    var padding = scroll > 30 ? 0 : 30 - scroll;
    $(".timeline-progress ul").css("padding-top", padding);
})

var LOGIN = false,
    CHECK_LOGIN = false,
    USERID = '',
    USERNAME = '',
    EMAIL = '',
    REPORT_OBJECT,
    GAUGE,
    ADDITIONAL_REPORT = [],
    DB_COMMENT_URL = "news/comments/",
    DB_VOTE_URL = "news/like/",
    ENABLE_DATA_ATTACHMENT = true;

var entire_download = 0.0,
    entire_download_cnt = 0,
    entire_upload = 0.0,
    entire_upload_cnt = 0;

    
function initParams() {
    var params = window.location.search.substring(1).split("&");
    for (var p in params) {
        if (params[p].split("=")[0] == "experiment") {// experiment mode
            var mode = params[p].split("=")[1];

            if(mode == "A") {
                DB_COMMENT_URL = "internet_base/comments/";
                DB_VOTE_URL = "internet_base/like/";
                $(".comment-add-report").hide();
                ENABLE_DATA_ATTACHMENT = false;
            }
            else if(mode == "B") DB_COMMENT_URL = "internet_data/comments/";
            else if(mode == "C") {
                DB_COMMENT_URL = "lecture_base/comments/";
                DB_VOTE_URL = "lecture_base/like/";
                $(".comment-add-report").hide();
                ENABLE_DATA_ATTACHMENT = false;
            }
            else if(mode == "D") DB_COMMENT_URL = "lecture_data/comments/";

            CHECK_LOGIN = true;
            LOGIN = true;

            /* For experiment purpose */
            USERID = generateID(8);
            USERNAME = generateID(8);
            EMAIL = generateID(8)+"@qwe.edu";

            // Prevent participants from escaping
            $("header").hide(); 
        }
    }
}

function test() {
    toggleFixedLoading(".content-loading");
    setTimeout(showPage, 1000);
}

function showPage() {
    toggleFixedLoading(".content-loading");
    $(".content").css("visibility", "visible");

    $(".hello-msg").show();

    var hash = window.location.hash;
    window.location.hash = "";
    window.location.hash = hash;
}

$(function() {
    // Show loading spinner
    toggleFixedLoading(".loading");

    initParams();
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

    $(".fixed-fab-child .btn").fadeToggle(0);
    $(".fixed-fab").hover(function() {
        var len = $(".fixed-fab-child .btn").size();
        $(this).toggleClass(".fixed-fab-active");
        $(".fixed-fab-child .btn").map(function(i, v) {
            if ($(".fixed-fab").hasClass(".fixed-fab-active")) {
                var toggle_time = 200 * (len - i);
            } else {
                var toggle_time = 300 * i;
            }
            $(this).fadeToggle(toggle_time);
        })
    });

    $('[data-spy="scroll"]').each(function() {
        var $spy = $(this).scrollspy('refresh')
            // alert();
    })

    $('body').on('activate.bs.scrollspy', function() {
        // do something…
        // console.log("test");
    })

    $(".timeline-progress a").on('click', function(event) {
        // Make sure this.hash has a value before overriding default behavior
        if (this.hash !== "") {
            // Prevent default anchor click behavior
            event.preventDefault();

            // Store hash
            var hash = this.hash;

            // Using jQuery's animate() method to add smooth page scroll
            // The optional number (800) specifies the number of milliseconds it takes to scroll to the specified area
            $('html, body').animate({
                scrollTop: $(hash).offset().top
            }, 800, function() {
                // Add hash (#) to URL when done scrolling (default click behavior)
                window.location.hash = hash;
            });

        } // End if

    });

    // fb share button listener
    $(".fb-share").click(function() {
        window.open(
            "http://www.facebook.com/sharer/sharer.php?u=" + (window.location.origin + window.location.pathname) + "&sharing=true"
        );
    })
    $(".link-share").click(function() {
        var share_url = window.location.origin + window.location.pathname;

        /* iOS case (it does not support clipboard copy) */
        if (detectOS() == "ios") {
            $("#ios-url").val(share_url);
            $('#ios-prompt-modal').modal();
            setTimeout(function() {
                $("#ios-url").select();
            }, 500);
            return;
        }

        var $temp = $("<input>");
        $("body").append($temp);
        $temp.val(share_url).select();
        document.execCommand("copy");
        $temp.remove();
        var alert = '<div id="clip-alert" class="alert alert-warning alert-dismissible ' +
            'col-lg-4 col-lg-offset-4 col-md-4 col-md-offset-4 col-xs-10 col-xs-offset-1" role="alert">' +
            '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
            '<span aria-hidden="true">&times;</span>' +
            '</button>클립보드에 복사되었습니다</div>'
        var a_div = document.createElement("div");
        a_div.innerHTML = alert;
        $("body").append(a_div);
        setTimeout(function() {
            $("#clip-alert").fadeOut("normal", function() {
                $(this).remove();
            });
        }, 1000);
    })

    drawBarChart();

    // Check whether the user is authenticated at firebase
    var user = firebase.auth().currentUser;
    if (!user) {
        firebase.auth().signInAnonymously().then(function(user) {
            setFirebaseID(user.uid)
        });
    } else setFirebaseID(user.uid);

    /* Flow: fb sdk install / fetch comments from DB then append and bind events -> check login status. */
    init_comments();
});

function displayBldgList() {
    // Try HTML5 geolocation.
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(function(position) {
                center = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                // DEBUGGING purpose
                // center = {
                //     "lat": 36.374,
                //     "lng": 127.3655
                // };

                // center = {
                //     "lat": 36.374,
                //     "lng": 127.360
                // };

                fetchBldgList(center);

            },
            function() { //error callback
                console.log("Error geolocation");
                // alert('브라우저의 위치정보 수집이 불가합니다. 설정에서 승인 후 다시 시도해주세요.');
                $("#loc-msg").text("위치 검색이 불가해 자동으로 현재 건물을 찾을 수 없습니다. 현재 위치한 건물을 선택해주세요.");
                fetchBldgList();
                // handleLocationError(true, infoWindow, map.getCenter());
            }, {
                timeout: 10000
            });


    } else {
        // Browser doesn't support Geolocation
        console.log("Error geolocation; brower doesn't support");
        // alert('브라우저의 위치정보 수집이 불가합니다. 다른 브라우저에서 다시 시도해주세요.');
        $("#loc-msg").text("위치 검색이 불가해 자동으로 현재 건물을 찾을 수 없습니다. 현재 위치한 건물을 선택해주세요.");

        fetchBldgList();
        // handleLocationError(false, infoWindow, map.getCenter());
    }
}

/* Should call this function every time new comments appended. */
function prettifyTweet(inSelector) {
    tweetParser(inSelector, {
        urlClass: "tweet_link", //this is default
        userClass: "tweet_user",
        hashtagClass: "tweet_hashtag", //this is default
        target: "_blank", //this is default
        searchWithHashtags: false, //this is default
        parseUsers: true,
        parseHashtags: true,
        parseUrls: true
    });
}

function fetchBldgList(inCenter) {
    var list = [],
        cnt = 0;

    $('.building-list-ul li').not('li:first').remove();
    // $('.building-list-ul').append('<li><a onclick="displayBldgList()">내 건물 검색<div style="color: gray"><i class="fa fa-map-marker" aria-hidden="true"></i> 위치정보 수집</div><p id="loc-msg"></p></a></li>');

    // $('.building-list-ul').append(
    //     '<li bldg="99"><a>전체</a></li>');

    for (var l in BLDG) {
        if (center) {
            if (Math.abs(center.lat - BLDG[l].lat) < 0.001 && Math.abs(center.lng - BLDG[l].lng) < 0.001) {
                $('.building-list-ul').append(
                    '<li bldg=' + l + '><a>' + BLDG[l].name + '</a></li>');

                list.push({ "lat": BLDG[l].lat, "lng": BLDG[l].lng, name: BLDG[l].name });
            }
        }

    }

    if (list.length == 0)
        for (var l in BLDG) {
            $('.building-list-ul').append(
                '<li bldg=' + l + '><a>' + BLDG[l].name + '</a></li>');

            list.push({ "lat": BLDG[l].lat, "lng": BLDG[l].lng, name: BLDG[l].name });
        }


}

function fetchComments() {
    var commentsRef = firebase.database().ref(DB_COMMENT_URL);
    commentsRef.on("child_added", function(snapshot) {
        var news_json = snapshot.val(); // data is here
        // debugger;
        console.log(news_json);
        
        append_nested_comment("nested-comment", news_json, snapshot.key);

        /* Styling for hash,@,url */
        prettifyTweet('.tweet p');

        /* Check login state and show popover when the user is not signed in. */
        checkLoginState();

        var $current_commment = $(".comment-" + snapshot.key + " .fa-chevron-up");
        
        $current_commment.text(news_json["like"])

        $(".loading").hide();
    });

    commentsRef.on("child_changed", function(snapshot) {     // like, dislike event, nested comment 
        var news_json = snapshot.val(); // data is here

        var $current_commment = $(".comment-" + snapshot.key + " .fa-chevron-up");
        
        $current_commment.text(news_json["like"])

        var parent_id = "nested-comment_" + snapshot.key;
        
        for (var c_key in news_json["comments"]) {
            append_comment_html(parent_id, c_key, news_json["comments"][c_key], true, true);
        }
        

    });
}

function fetchReport() {
    toggleFixedLoading(".locaiton-loader");

    if (REPORT_OBJECT) { //already fetched.
        appendReport();
    } else {
        var uRef = firebase.database().ref("users/");
        uRef.once("value").then(function(snapshot) {
            REPORT_OBJECT = snapshot.val(); // bldg/activity/OS/ping/down/up
            appendReport();
            // if (!report) { // no recent report
            //     var answer = confirm("오늘 인터넷 불편 제보가 없습니다. 지금 제보(1분)하러 가시겠어요?")
            //     if (answer)
            //         window.location = "./collect.html";

            //     else return;
            // }
        });
    }

}

function addMoreReport() {
    var recent_report = $('.recent-report .result');
    $(".add-more").remove();

    for (var i = 0; i < 5; i++) {
        if (ADDITIONAL_REPORT.length)
            recent_report.append(ADDITIONAL_REPORT.shift());
        else {
            $(".add-more").remove();
            return;
        }
    }

    recent_report.append("<a class='add-more' onclick='addMoreReport()'>+ 제보 더 불러오기</a>");
}

function formatDate(inDate) {
    var days = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일", ];
    var t = inDate.toTimeString().split(' ')[0];
    t = t.substring(0, t.length - 3);

    return [inDate.getMonth() + 1 + "/" + inDate.getDate(), days[inDate.getDay()], t].join(" ");
}

function appendReport() {
    $('.result').remove();
    var report_display = $(".report-display");
    report_display.find('.recent-report').append("<div class='result'></div>")
    var recent_report = report_display.find('.recent-report .result');

    var selected_date_num = $('.time-list-ul li.active').attr("date"),
        date_range = [];
    if (selected_date_num == 0) // today
        date_range.push([new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()].join("-"));
    else if (selected_date_num == 1) // yesterday
        date_range.push([new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate() - 1].join("-"));
    else if (selected_date_num == 2) { // this week{
        for (var i = 0; i < 7; i++) {
            date_range.push([new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate() - i].join("-"));
        }
    } else {
        for (var d = new Date(); d >= new Date("Mon Apr 04 2017 00:00:1 GMT+0900 (KST)"); d.setDate(d.getDate() - 1)) {
            date_range.push([d.getFullYear(), d.getMonth() + 1, d.getDate()].join("-"));
        }
    }
    var report_radio = "";
    var exist_flag = false,
        cnt = 0,
        download = 0.0,
        download_cnt = 0,
        upload = 0.0,
        upload_cnt = 0;

    entire_download = 0.0,
        entire_download_cnt = 0,
        entire_upload = 0.0,
        entire_upload_cnt = 0,
        ADDITIONAL_REPORT = [];
    var selected_bldg_num = $('.building-list-ul li.active').attr("bldg"),
        selected_internet_num = $('.internet-list-ul li.active').attr("internet");

    if (!selected_bldg_num) {
        alert('건물은 필수선택사항 입니다');
        toggleFixedLoading(".locaiton-loader");
        return;
    }

    for (var d in date_range) {
        for (var r in REPORT_OBJECT[date_range[d]]) {
            var report = REPORT_OBJECT[date_range[d]][r];
            // if (selected_bldg_num && (selected_bldg_num != 99 && selected_bldg_num != report.bldg)) continue;
            if (selected_internet_num && (selected_internet_num != 99 && selected_internet_num != report.type)) continue;

            var report_txt;
            if (report.activity) {
                report_txt = [report.activity, SPEED_MSG[parseInt(report.speed) - 1]].join(", ");
                report_txt_sub = [report.download + "Mbps / " + report.upload + "Mbps", '<i class="fa fa-clock-o" aria-hidden="true"></i> ' + formatDate(new Date(report.time))].join(", ");
                report_txt_sub = "<p style='color: gray'>" + report_txt_sub + "</p>";

                entire_download += parseFloat(report.download);
                entire_download_cnt++;

                if (report.upload != "--") {
                    entire_upload += parseFloat(report.upload);
                    entire_upload_cnt++;
                }

                if (selected_bldg_num != report.bldg) continue;

                exist_flag = true;

                download += parseFloat(report.download);
                download_cnt++;

                if (report.upload != "--") {
                    upload += parseFloat(report.upload);
                    upload_cnt++;
                }

                if (cnt++ < 5) {
                    report_radio += ("<div class='radio'><label download='" + report.download + "'><input type='radio' name='report-radio' " + "value='" + BLDG[report.bldg].name + " " + WIFI_TYPE_MSG[report.type] + " " + formatDate(new Date(report.time)) + "'/> " + report_txt + report_txt_sub + "</label></div>");
                } else {
                    ADDITIONAL_REPORT.push("<div class='radio'><label download='" + report.download + "'><input type='radio' name='report-radio' " + "value='" + BLDG[report.bldg].name + " " + WIFI_TYPE_MSG[report.type] + " " + formatDate(new Date(report.time)) + "'/> " + report_txt + report_txt_sub + "</label></div>");
                }
            } else {
                report_txt = [BLDG[report.bldg].name, "연결불능", report.os, report.web, report.time.split("GMT")[0].replace("2017 ", "")].join(", ");
                continue; //todo
                // if (cnt++ < 15)
                //     report_radio += ("<div class='radio'><label><input type='radio' name='report-radio' " + "value='" + report_txt + "'/> " + '<i class="fa fa-building-o" aria-hidden="true"></i> ' + report_txt + "</label></div>");
            }
        }
    }
    if (exist_flag) {
        recent_report.append("<p>건물</p>");
        var stat_txt = [
            //'<i class="fa fa-building-o" aria-hidden="true"></i>',
            BLDG[selected_bldg_num].name,
            ", 평균 Download/Upload 속도 : " + (download / download_cnt).toFixed(2) + "Mbps/" + (upload / upload_cnt).toFixed(2) + "Mbps"
        ].join(" ");
        recent_report.append("<div class='radio'><label download=" + (download / download_cnt) + "><input type='radio' name='report-radio'" + "value='" + stat_txt + "'/> " + stat_txt + "</label></div>");

        recent_report.append("<p>개별 제보 (최근 5개까지 표시)</p>");
        recent_report.append(report_radio);
        if (ADDITIONAL_REPORT.length)
            recent_report.append("<a class='add-more' onclick='addMoreReport()'>+ 제보 더 불러오기</a>");

    } else {
        updateProgressbar(); // empty the progress bar
        recent_report.append("<p>조건에 해당하는 제보가 없습니다.</p>");
    }

    // recent_report.append("<a onclick='if(confirm(" + '"인터넷 불편 제보하기(1분) 페이지로 이동하시겠습니까?"' + ")) window.location = " + '"./collect.html"' + "; else return;'>내 제보 추가하기</a>");

    toggleFixedLoading(".locaiton-loader");
}

function handleOutboundLinkClicks(event) {
    ga('send', 'event', 'news', 'click', event.getAttribute("href"), {
        'transport': 'beacon',
        'hitCallback': function() {
            document.location = event.getAttribute("href");
        }
    });
}

function handleClickEvents(type, value) {
    ga('send', 'event', 'data_communication', type, value);
}

function countLetter(inElement) {
    var postLength = detectBrowser() == 'ie' ? inElement.textContent.length : inElement.textLength;
    var charactersLeft = 140 - postLength;
    inElement.getElementsByClassName("status-box");

    var counter = inElement.parentElement.parentElement.parentElement.getElementsByClassName("counter")[0];
    counter.innerHTML = charactersLeft;

    if (charactersLeft < 0) {
        inElement.parentElement.parentElement.parentElement.getElementsByClassName("comments-post")[0].classList += " disabled";
        counter.classList += " minus-counter";
    } else if (charactersLeft == 140) {
        inElement.parentElement.parentElement.parentElement.getElementsByClassName("comments-post")[0].classList += " disabled";
    } else {
        inElement.parentElement.parentElement.parentElement.getElementsByClassName("comments-post")[0].classList.remove("disabled");
        counter.classList.remove("minus-counter");
    }
}

function getLogin() {
    if (!CHECK_LOGIN) checkLoginState(); // check login status for the first time.
    return LOGIN;
}

function setLogin(inVal) { LOGIN = inVal; }

function getFirebaseID() {
    if (firebase.auth().currentUser.uid) return firebase.auth().currentUser.uid;
    return null;
}

function setFirebaseID(inID) {
    FIREBASE_ID = inID;
}

// This function is called when someone finishes with the Login
// Button.  See the onlogin handler attached to it in the sample
// code below.
function checkLoginState() {
    if (CHECK_LOGIN) return true;

    if (detectBrowser() == 'firefox') {
        var request = indexedDB.open("MyTestDatabase");
        request.onerror = function(event) {
            //private Mode
            alert("현재 웹 브라우저가 프라이빗 모드로 되어있어 포럼 참여 기능에 제약이 있을 수 있습니다. ");

            //turn off loader
            toggleFixedLoading(".loading");

            $("#nested-comment").append("<li style='color:red;'>파이어폭스 프라이빗 모드에선 포럼 참여 기능이 지원되지 않습니다.</li>");
        };
    }

    FB.getLoginStatus(function(response) {
        checkLoginStateCallback(response);
    });
}

// This is called to get fb Login Status.
function checkLoginStateCallback(response) {
    CHECK_LOGIN = true;

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

            // hide popover
            $(document).on('focus', ':not(.popover)', function() {
                $('.popover').popover('hide');
            });
        });
    } else {
        setLogin(false);

        /* Suggest login when the user attempts to vote before */
        init_popover($(".tweet .fa-chevron-up"));
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
    $("#nested-comment").after($reply_html);

    //Suggest login only when the user is not currently logged in
    if (!getLogin())
        init_popover($reply_html.find(".comments-post"));
}

function init_popover($x) {
    var popover_html =
        '<a href="javascript:void(0);" onclick="fbLogin()"><i class="fa fa-facebook-square fa-2x" aria-hidden="true"></i></a>'
        /*+
                '<i class="fa fa-google fa-2x" aria-hidden="true"></i>' +
                '<i class="fa fa-twitter fa-2x" aria-hidden="true"></i>' */

    $x.popover({
        html: true,
        content: popover_html,
        title: '로그인',
        delay: { show: 0, hide: 250 },
    });
}

function drawProgressBar(inSelector) {
    $(inSelector).css("width", "100%");
    $(inSelector).css("height", "120px");

    var title = (inSelector.jquery) ? $(inSelector).attr('title') : inSelector.getAttribute('title'),
        subtitle = (inSelector.jquery) ? $(inSelector).attr('subtitle') : inSelector.getAttribute('subtitle'),
        value = (inSelector.jquery) ? $(inSelector).attr('value') : inSelector.getAttribute('value'),
        subvalue = (inSelector.jquery) ? $(inSelector).attr('subvalue') : inSelector.getAttribute('subvalue');

    return gauge = $(inSelector).dxLinearGauge({
        scale: {
            startValue: 0,
            endValue: 100,
            tickInterval: 20,
            label: {
                customizeText: function(arg) {
                    if (arg.valueText == "100")
                        return "국내 평균 인터넷";
                    return arg.valueText + "%"
                }
            }
        },
        title: {
            text: title,
            font: { size: 20 },
            subtitle: {
                text: subtitle,
                font: { size: 12 }
            }
        },
        value: [value],
        valueIndicator: {
            color: '#ff6c40'
        },
        subvalues: subvalue ? subvalue.split(",") : null,
        subvalueIndicator: {
            type: 'textCloud',
            color: '#734F96',
            text: {
                customizeText: function(arg) {
                    return "교내 평균 속도";
                },
                font: {
                    size: 10
                }
            }
        }
    }).dxLinearGauge("instance");
}

function getSearchDate() {
    var today = [new Date().getMonth() + 1, new Date().getDate()].join("/");
    if ($('.time-list-ul li.active').attr("date") == "99") return "4/4 ~ " + today; // whole
    else if ($('.time-list-ul li.active').attr("date") == "0") return today;
    else if ($('.time-list-ul li.active').attr("date") == "1") return [new Date().getMonth() + 1, new Date().getDate() - 1].join("/");
    else if ($('.time-list-ul li.active').attr("date") == "2") return [new Date().getMonth() + 1, new Date().getDate() - 6].join("/") + "~ " + today;

    return "4/4 ~ " + today; // whole
}

function setProgressbarValue(inObj, inData) {
    inObj.value(inData);
}

function setProgressbarSubValue(inObj, inData) {
    inObj.subvalues(inData);
}

function setProgressbarTitle(inText) {
    $(".recent-report .dxg-title text:nth-child(1)").text(inText);
}

function setProgressbarSubTitle(inText) {
    $(".recent-report .dxg-title text:nth-child(2)").text(inText);
}

function updateProgressbar($inElem) {
    // setProgressbarSubTitle();getSearchDate.toFixed(2)
    if ($inElem) { //when a radio is selected. 
        if ($(".radio label").index($inElem) == 0)
            setProgressbarTitle([BLDG[$('.building-list-ul li.active').attr("bldg")].name, $('.internet-list-ul li.active a').text(), getSearchDate()].join(" "));
        else
            setProgressbarTitle($inElem.children("input").val());
        setProgressbarSubTitle("국내 평균 인터넷 기준 하위 " + (parseFloat($inElem.attr('download')) / 144 * 100).toFixed(1) + "%");
        setProgressbarValue(GAUGE, (parseFloat($inElem.attr('download')) / 144 * 100));

        if (entire_download) setProgressbarSubValue(GAUGE, [entire_download / entire_download_cnt / 144 * 100]);
    } else { //when new search is selected.
        setProgressbarTitle("아래에서 인터넷 제보를 선택해주세요");
        setProgressbarSubTitle("-");
        setProgressbarValue(GAUGE, 0);
        setProgressbarSubValue(GAUGE, []);
    }

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
        if (!getLogin()) return;

        var like_num = 0;
        /* If it's alreay up voted, cancel and decrement the vote. */
        if ($(this).hasClass("active")) { // cancel vote
            like_num = -1;
            $(this).removeClass("active");
        } else { // up vote
            like_num = 1;
            $(this).addClass("active");
        }

        var parent_id,
            comment_id;

        // if the comment is root
        if ($(this).parent().parent().attr("id").split("_").length == 2) parent_id = '', comment_id = $(this).parent().parent().attr("id").split("_")[1];
        else parent_id = $(this).parent().parent().attr("id").split("_")[1],
            comment_id = $(this).parent().parent().attr("id").split("_")[2];

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
            $("#nested-comment>.media").show();
        else {
            $(".media").hide();
            $("#nested-comment>.comment-" + target).show();
        }

    });

    $("body").on("click", ".close-report-display", function() {
        $(".comment-add-report").removeClass("active");
        $(".report-display-container").remove();
    });

    $("body").on("click", ".comment-add-report", function() {
        // Remove other element before add new one.

        var report_display = $(this).parent().find(".report-display");

        $(this).toggleClass("active");
        if(!$(this).hasClass("active")) {
            $(".report-display-container").remove();
            return;
        }

        //add container
        report_display.append("<div class='report-display-container'></div>");
        report_display = report_display.find('.report-display-container');

        // add close button
        report_display.append('<button type="button" class="close close-report-display" aria-label="Close"><span aria-hidden="true">&times;</span></button>');

        report_display.append('<div class="recent-report"></div>');
        var recent_report = report_display.find('.recent-report');

        // add progress bar
        recent_report.append('<div class="report-progressbar"></div>');
        recent_report.find(".report-progressbar").attr("title", "이야기할 인터넷 경험에 해당하는 제보를 선택해주세요");
        recent_report.find(".report-progressbar").attr("subtitle", "국내 평균 Wi-Fi 속도와 비교 (출처: 2016년도 통신서비스 품질평가 결과)");
        recent_report.find(".report-progressbar").attr("value", 0);

        GAUGE = drawProgressBar(recent_report.find(".report-progressbar"));

        // add navbar for report search
        recent_report.append('<nav class="navbar navbar-default">' +
            '<div class="container-fluid">' +
            '<div class="navbar-header"><a class="navbar-brand">제보 검색</a>' +
            '</div>' +
            '<ul class="nav navbar-nav search-nav">' +
            '<li class="dropdown">' +
            '<a class="dropdown-toggle" data-toggle="dropdown" href="#">건물 검색' +
            '<span class="caret"></span></a>' +
            '<ul class="dropdown-menu building-list-ul">' +
            '<li><a onclick="displayBldgList()">내 건물 검색<div style="color: gray"><i class="fa fa-map-marker" aria-hidden="true"></i> 위치정보 수집</div><p id="loc-msg"></p></a></li>' +
            '</ul>' +
            '</li>' +
            '<li class="dropdown">' +
            '<a class="dropdown-toggle" data-toggle="dropdown" href="#">시간 검색' +
            '<span class="caret"></span></a>' +
            '<ul class="dropdown-menu time-list-ul">' +
            '<li date="99"><a>전체</a></li>' +
            '<li date="0"><a>오늘</a></li>' +
            '<li date="1"><a>어제</a></li>' +
            '<li date="2"><a>최근 일주일</a></li>' +
            '</ul>' +
            '</li>' +
            '<li class="dropdown">' +
            '<a class="dropdown-toggle" data-toggle="dropdown" href="#">인터넷 유형' +
            '<span class="caret"></span></a>' +
            '<ul class="dropdown-menu internet-list-ul">' +
            '<li internet="99"><a>전체</a></li>' +
            '<li internet="0"><a>Welcome_kaist</a></li>' +
            '<li internet="1"><a>랜선</a></li>' +
            '<li internet="2"><a>그 외</a></li>' +
            '</ul>' +
            '</li>' +
            // '<li class="dropdown">' +
            // '<a class="dropdown-toggle" data-toggle="dropdown" href="#">인터넷 체감' +
            // '<span class="caret"></span></a>' +
            // '<ul class="dropdown-menu satisfaction-list-ul">' +
            // '<li satisfaction="99"><a>전체 (응답없음 ~ 즉각적)</a></li>' +
            // '<li satisfaction="0"><a>응답없음 ~ 지연 있음</a></li>' +
            // '<li satisfaction="1"><a>응답없음 ~ 지연 심함</a></li>' +
            // '<li satisfaction="2"><a>응답없음</a></li>' +
            // '</ul>' +
            // '</li>' +
            '</ul>' +
            '</li>' +
            '</ul>' +
            '</div>' +
            '</nav>');

        fetchBldgList();

        // add current loader container
        recent_report.append("<div class='locaiton-loader' style='left:50%;'></div>");

        // add building list table
        // recent_report.append('<div class="building-list-container"><table class="building-list table table-hover"><tbody></tbody></table></div>');

    });

    /* Bind report building search pick. */
    $("body").on("click", ".dropdown-menu li a", function(e) {
        handleClickEvents("dropdown", $(this).text());

        if ($(this).parent().attr('bldg') || $(this).parent().attr('date') || $(this).parent().attr('internet')) { // if the user select a building
            //change displayed value at dropdown.

            $(this).parent().parent().find('li').removeClass("active");
            $(this).parent().addClass("active");
            $(this).parents(".dropdown").find('.dropdown-toggle')
                .html($(this).text() + ' <span class="caret"></span>');
            $(this).parents(".dropdown").find('.dropdown-toggle')
                .val($(this).data('value'));

            updateProgressbar();

            // show corresponding reports.
            fetchReport();
        } else { // if user selects location search
            e.stopPropagation(); // prevent dropdown to be closed.
        }
    });

    $('body').on('click', '.radio label', function() {
        handleClickEvents("radio", $(this).find("input").attr("value"));
        updateProgressbar($(this));
    });

    $("body").on("appended", ".comment-progressbar", function(event) {
        //event after append the element into DOM, do anything
        drawProgressBar($(this));
    });
}

function postVote(inCommentID, inParentID, inLikeNum) { // inLikeNum 1 when upvote, -1 when down vote
    var pRef = firebase.database().ref(DB_COMMENT_URL + (inParentID ? inParentID + "/comments/" + inCommentID : inCommentID) + "/like");
    pRef.transaction(function(searches) {
        return (searches || 0) + inLikeNum;
    });

    var uRef = firebase.database().ref(DB_VOTE_URL + (USERID ? USERID : firebase.auth().currentUser.uid) + "/" + inCommentID);
    uRef.set((inLikeNum==1? true: false),
        function(error) {
            if (error) {
                console.log(error);
            } else { // if successfully posted a new comments clear textarea and turn off loading spinner.

            }
        });
}

/* post a new comment to DB. */
function postComment(inElement) {
    if (!CHECK_LOGIN) checkLoginState(); // check login status for the first time.
    if (!getLogin()) return; // check fb authentication

    postCommentCallback(inElement);
}

function postCommentCallback(inElement) {
    // turn on loading spinner.
    toggleFixedLoading(".loading");

    var new_comment_elem = inElement.parentElement.parentElement,
        content = new_comment_elem.getElementsByClassName("status-box")[0].value,
        parent_id = '',
        comment_type;

    // append report if existg
    if (new_comment_elem.querySelector("input[name='report-radio']:checked")) {

        if ($(":radio[name='report-radio']:checked").index(":radio[name='report-radio']") == 0) // building average
            content = '<div class="comment-progressbar" title="' + $(".recent-report .dxg-title text:nth-child(1)").text() + '" subtitle="' + $(".recent-report .dxg-title text:nth-child(2)").text() + '" value="' + GAUGE.value() + '" subvalue="' + GAUGE.subvalues()[0] + '"></div>' + '<p>' + content + '</p>';
        else { // individual report
            var s = $(":radio[name='report-radio']:checked").val().split(", ");
            s.shift();
            content = '<div class="comment-progressbar" title="' + $(".recent-report .dxg-title text:nth-child(1)").text() + '" subtitle="' + $(".recent-report .dxg-title text:nth-child(2)").text() + '" value="' + GAUGE.value() + '" subvalue="' + GAUGE.subvalues()[0] + '"></div>' + '<p>' + content + '</p>';
        }
    }
    //content = "<strong>" + new_comment_elem.querySelector("input[name='report-radio']:checked").value + "</strong> " + content;

    // if a new comment is not root comment
    if (new_comment_elem.id != "root-like") {
        parent_id = new_comment_elem.parentElement.id.split("comment_")[1];
        comment_type = 2;
    } else comment_type = new_comment_elem.querySelector("input[name='comment-type']:checked").value;

    var comment_key = generateID(8);
    /* UID for a new comments. */
    var playersRef = firebase.database().ref(DB_COMMENT_URL + (parent_id ? parent_id + "/comments/" : ""));
    
    var news_json = {
        "type": comment_type,
        "content": content,
        "time": new Date().toString(),
        "email": EMAIL + "/rally/" + USERNAME,
        "like": 0,
        "dislike": 0
    };

    playersRef.push(news_json);

    // clean textbox
    $(".status-box").val("")

    /* Append at front */
    // var root_id = "nested-comment"
    // var parent_id = (parent_id == '') ? root_id : root_id + "_" + parent_id;
    // append_comment_html(parent_id, comment_key, news_json, true, true);

    // prettifyTweet(".comment-" + comment_key + " p");

    // console.log(USERNAME, EMAIL, content);
    // playersRef.set(news_json, function(error) {
    //     if (error) {
    //         console.log(error);
    //     } else {
    //         // if successfully posted a new comments clear textarea and turn off loading spinner.
    //         new_comment_elem.getElementsByClassName("status-box")[0].value = "";
    //         $('.report-display').empty();
    //         toggleFixedLoading(".loading");
    //     }
    // });
}

function get_reply_html(type) {
    var tracker = "handleClickEvents(\"start\",\"\")";
    var reply_html =
        '<div id="like">' +
        (type == 1 ? // add comment radio only for root comment
            ('<form class="form-inline"><div class="form-group">' +
                '<label class="radio-inline">' +
                '<input type="radio" value="0" name="comment-type" id="comment-question" value="comment-question" checked> 제안' +
                '</label>' +
                '<label class="radio-inline">' +
                '<input type="radio" value="1" name="comment-type" id="comment-suggestion" value="comment-suggestion"> 질문' +
                '</label>' +
                '<label class="radio-inline">' +
                '<input type="radio" value="2" name="comment-type" id="comment-else" value="comment-else"> 그 외' +
                '</label>' +
                '</div></form>') : "") +
        '<form style="margin-top: 10px;">' +
        // '<span class="form-inline">' +
        // '<label for="comment-to"><i class="fa fa-paper-plane-o" aria-hidden="true"></i></label>' +
        // '<input type="text" class="form-control" id="comment-to" placeholder="아무나">' +
        // '</span>' +
        
        '<div class="form-group">' +
        '<textarea class="form-control status-box" onkeyup="countLetter(this)" rows="2"></textarea>' +
        '</div>' +
        '</form>' +
        '<div class="button-group post-button-group">' +
        '<p class="counter">140</p>' +
        '<a class="btn btn-primary comments-post like-comment disabled" onclick="postComment(this)" tabindex="0" data-container="body" ' +
        'data-toggle="popover" data-trigger="focus" data-placement="top">Post</a>' +
        '</div>' +
        (type && ENABLE_DATA_ATTACHMENT == 1 ? // add quoting only for root comment
        '<p class="btn btn-default comment-add-report" onclick=' + tracker + '>+ 인터넷 제보 첨부하기</p>'
         : "") +
        '<div class="report-display"></div>'+
        '</div>';

    return reply_html;
}

/* @param {string} nc_id - id of root node. must be <ul>
@param {object} news_json - object from database
Traverse news_json and append recursively comments
which has "content" key */
function append_nested_comment(nc_id, news_json, key) {

    /* Allow only one nested comment */
    var depth = nc_id.split("_").length - 1;
    if (depth >= 2) {
        return;
    }

    /* deep copy */
    var c_news_json = $.extend(true, {}, news_json);

    

    /* if is_comment: append comment */
    if (is_key(c_news_json, "content")) {
        append_comment_html(nc_id, key, c_news_json, false);
    }
    /* if is_leaf: break; */
    if (typeof(c_news_json) != "object") {
        return;
    }
    /* Recursive call to child json */
    var parent_id = nc_id + "_" + key;
    
    if(!is_key(c_news_json, "comments"))
        return;

    /* sort by time.  */
    var keysSorted = Object.keys(c_news_json.comments).sort(function(a, b) {
        return new Date(c_news_json.comments[a].time) - new Date(c_news_json.comments[b].time);
    })

    /* traversal */
    for (var i in keysSorted) {
        var key = keysSorted[i];

        /* Recursive call to child json */
        append_nested_comment(parent_id, c_news_json.comments[key], key)
    }
    
}

function append_comment_html(parent_id, cid, news_json, visible, trigger) {
    var c_news_json = $.extend(true, {}, news_json);
    var new_id = parent_id + "_" + cid;

    if($("#" + new_id).length) return;

    var $parent = $(document.getElementById(parent_id));

    var icon = get_comment_icon(c_news_json.type);
    var title = getDisplayNickname(c_news_json.email);
    var content = c_news_json.content;

    /* Build comment html */
    var html =
        '<li class="media comment-' + getClassPostfix(c_news_json.type) + (getDisplayNickname(c_news_json.email).indexOf("*") == -1 ? " media-emphasized" : "") + ' ">' +
        '<div class="media-left">' +
        '<i class="fa fa-2x ' + icon + '" aria-hidden="true"></i>' +
        '</div>' +
        '<div class="media-body" id=' + new_id + '>' +
        '<p class="media-heading">' +
        title +
        '<span class="comment-date"> · ' +
        c_news_json.time.split(" GMT")[0] +
        '</span>' +
        '</p>' +
        '<div id=' + 'comment-' + new_id + ' class=' + '"tweet comment-' + cid + '">' +
        '<p>' + content + '</p>' +
        '<i class="fa fa-reply" aria-hidden="true"></i>' +
        '<i class="fa fa-chevron-up" aria-hidden="true" tabindex="0" ' +
        'data-container="body" data-toggle="popover" data-trigger="focus" data-placement="top">' +
        c_news_json.like +
        '</i>' +
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
        /* Del reply btn and like btn at nested comment */
        $html.find(".fa-reply").remove();
        $html.find(".fa-chevron-up").remove();
        if (!visible) {
            $html.hide();
        }
    }


    $parent.append($html)
    $parent.find('.comment-progressbar').trigger('appended');

    $("#" + new_id).addClass("new-comment-highlight");

}

function getDisplayNickname(email) {
    if (email.indexOf("jrburuter") != -1 || email.indexOf("kaistusc") != -1)
        return "학부총학생회";

    else if (email.indexOf("hhj29") != -1)
        return "대학원총학생회";

    return email.substring(0, 3) + "****";
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
    /* if is_leaf: break; */
    if (typeof(obj) == "object") return (Object.keys(obj).indexOf(key.toString()) !== -1);

    return false;
}
