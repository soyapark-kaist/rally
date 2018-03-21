var DB_REPORT_URL = "cs408/";

$(function() {
    // Show loading spinner
    toggleFixedLoading(".loading");
    
    /* Flow: fb sdk install / fetch comments from DB then append and bind events -> check login status. */
    fetchComments();
    init_comments();
    init_lecture_comments();

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

            // show corresponding reports.
            fetchReport();
        } else { // if user selects location search
            e.stopPropagation(); // prevent dropdown to be closed.
        }
    });

    $('body').on('click', '.radio label', function() {
        handleClickEvents("radio", $(this).find("input").attr("value"));
    });
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

function fetchReport() {
    toggleFixedLoading(".locaiton-loader");

    if (REPORT_OBJECT) { //already fetched.
        appendReport();
    } else {
        var uRef = firebase.database().ref(DB_REPORT_URL);
        uRef.once("value").then(function(snapshot) {
            REPORT_OBJECT = snapshot.val(); // bldg/activity/OS/ping/down/up
            appendReport();
            

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
    var $recent_report = report_display.find('.recent-report .result');

    var exist_flag = false,
        ADDITIONAL_REPORT = [];
    var selected_bldg_num = $('.building-list-ul li.active').attr("bldg"),
        selected_internet_num = $('.internet-list-ul li.active').attr("internet");

    var report_radio = "";
    console.log(REPORT_OBJECT)
    var one_post_exist = false;
    
    var report_text = ["F", "D", "C", "B", "A"];

    for(var post in REPORT_OBJECT) {
        var one_post = "<div class='one-post-radio'>";
        one_post += "<label>교수: "+ REPORT_OBJECT[post]["professor"] + ", 성적: " + report_text[REPORT_OBJECT[post]["grade"]]+ ", 강의: " + report_text[REPORT_OBJECT[post]["lecture"]]+ ", 로드: " + report_text[REPORT_OBJECT[post]["load"]] +"</label>"

        for(var r in REPORT_OBJECT[post]["paragraph"]) {
            var paragraph = REPORT_OBJECT[post]["paragraph"][r];
            console.log(paragraph)
            one_post += ("<div class='radio'><label download='" + 0 + "'><input type='radio' name='report-radio' " + "value='" + paragraph + "'/> " + paragraph + "</label></div>");

        }

        one_post += "</div>";
        $recent_report.append(one_post);
    }
        // for (var r in REPORT_OBJECT[date_range[d]]) {
        //     var report = REPORT_OBJECT[date_range[d]][r];
        //     // if (selected_bldg_num && (selected_bldg_num != 99 && selected_bldg_num != report.bldg)) continue;
        //     if (selected_internet_num && (selected_internet_num != 99 && selected_internet_num != report.type)) continue;

        //     var report_txt;
        //     if (report.activity) {
        //         report_txt = [report.activity, SPEED_MSG[parseInt(report.speed) - 1]].join(", ");
        //         report_txt_sub = [report.download + "Mbps / " + report.upload + "Mbps", '<i class="fa fa-clock-o" aria-hidden="true"></i> ' + formatDate(new Date(report.time))].join(", ");
        //         report_txt_sub = "<p style='color: gray'>" + report_txt_sub + "</p>";

        //         entire_download += parseFloat(report.download);
        //         entire_download_cnt++;

        //         if (report.upload != "--") {
        //             entire_upload += parseFloat(report.upload);
        //             entire_upload_cnt++;
        //         }

        //         if (selected_bldg_num != report.bldg) continue;

        //         exist_flag = true;

        //         download += parseFloat(report.download);
        //         download_cnt++;

        //         if (report.upload != "--") {
        //             upload += parseFloat(report.upload);
        //             upload_cnt++;
        //         }
            
        //         one_post += ("<div class='radio'><label download='" + report.download + "'><input type='radio' name='report-radio' " + "value='" + BLDG[report.bldg].name + " " + WIFI_TYPE_MSG[report.type] + " " + formatDate(new Date(report.time)) + "'/> " + report_txt + report_txt_sub + "</label></div>");
        //         one_post_exist = true;
        //     } else {
        //         /* For now, do nothing */
        //     }
        // }
        // one_post += "</div>";
        // if (one_post_exist) {
        //     if (cnt == 0) {
        //         report_radio = one_post;
        //     } else {
        //         ADDITIONAL_REPORT.push(one_post);
        //     }
        //     cnt++;
        // }
    
    // if (exist_flag) {
    //     recent_report.append("<p>건물</p>");
    //     var stat_txt = [
    //         //'<i class="fa fa-building-o" aria-hidden="true"></i>',
    //         BLDG[selected_bldg_num].name,
    //         ", 평균 Download/Upload 속도 : " + (download / download_cnt).toFixed(2) + "Mbps/" + (upload / upload_cnt).toFixed(2) + "Mbps"
    //     ].join(" ");
    //     recent_report.append("<div class='radio'><label download=" + (download / download_cnt) + "><input type='radio' name='report-radio'" + "value='" + stat_txt + "'/> " + stat_txt + "</label></div>");

    //     recent_report.append("<p>개별 제보 (최근 5개까지 표시)</p>");
    //     recent_report.append(report_radio);
    //     if (ADDITIONAL_REPORT.length)
    //         recent_report.append("<a class='add-more' onclick='addMoreReport()'>+ 제보 더 불러오기</a>");

    // } else {
        
    //     recent_report.append("<p>조건에 해당하는 제보가 없습니다.</p>");
    // }

    // recent_report.append("<a onclick='if(confirm(" + '"인터넷 불편 제보하기(1분) 페이지로 이동하시겠습니까?"' + ")) window.location = " + '"./collect.html"' + "; else return;'>내 제보 추가하기</a>");

    toggleFixedLoading(".locaiton-loader");
}

function getSearchDate() {
    var today = [new Date().getMonth() + 1, new Date().getDate()].join("/");
    if ($('.time-list-ul li.active').attr("date") == "99") return "4/4 ~ " + today; // whole
    else if ($('.time-list-ul li.active').attr("date") == "0") return today;
    else if ($('.time-list-ul li.active').attr("date") == "1") return [new Date().getMonth() + 1, new Date().getDate() - 1].join("/");
    else if ($('.time-list-ul li.active').attr("date") == "2") return [new Date().getMonth() + 1, new Date().getDate() - 6].join("/") + "~ " + today;

    return "4/4 ~ " + today; // whole
}

function init_lecture_comments() {
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

        // add navbar for report search
        recent_report.append('<nav class="navbar navbar-default">' +
            '<div class="container-fluid">' +
            '<div class="navbar-header"><a class="navbar-brand">제보 검색</a>' +
            '</div>' +
            '<ul class="nav navbar-nav search-nav">' +
            '<li class="dropdown">' +
            '<a class="dropdown-toggle" data-toggle="dropdown" href="#">성적별 검색' +
            '<span class="caret"></span></a>' +
            '<ul class="dropdown-menu time-list-ul">' +
            '<li grade="99"><a>전체</a></li>' +
            '<li grade="4"><a>A</a></li>' +
            '<li grade="3"><a>B</a></li>' +
            '<li grade="2"><a>C</a></li>' +
            '<li grade="1"><a>D</a></li>' +
            '<li grade="0"><a>F</a></li>' +
            '</ul>' +
            '</li>' +
            '<li class="dropdown">' +
            '<a class="dropdown-toggle" data-toggle="dropdown" href="#">로드별 검색' +
            '<span class="caret"></span></a>' +
            '<ul class="dropdown-menu time-list-ul">' +
            '<li date="99"><a>전체</a></li>' +
            '<li date="0"><a>A</a></li>' +
            '<li date="1"><a>B</a></li>' +
            '<li date="2"><a>C</a></li>' +
            '<li date="3"><a>D</a></li>' +
            '<li date="4"><a>F</a></li>' +
            '</ul>' +
            '</li>' +
            '<li class="dropdown">' +
            '<a class="dropdown-toggle" data-toggle="dropdown" href="#">강의별 검색' +
            '<span class="caret"></span></a>' +
            '<ul class="dropdown-menu internet-list-ul">' +
            '<li internet="99"><a>전체</a></li>' +
            '<li internet="0"><a>A</a></li>' +
            '<li internet="1"><a>B</a></li>' +
            '<li internet="2"><a>C</a></li>' +
            '<li internet="3"><a>D</a></li>' +
            '<li internet="4"><a>F</a></li>' +
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

        fetchReport();

        // add building list table
        // recent_report.append('<div class="building-list-container"><table class="building-list table table-hover"><tbody></tbody></table></div>');

    });
}

function postCommentCallback(inElement) {
    // turn on loading spinner.
    toggleFixedLoading(".loading");

    var new_comment_elem = inElement.parentElement.parentElement,
        content = "",
        parent_id = '',
        comment_type;

    // append report if existg
    if (new_comment_elem.querySelector("input[name='report-radio']:checked")) {

        content = "<blockquote>" + $(":radio[name='report-radio']:checked").val() + "</blockquote>";
        content += ("<p>" + new_comment_elem.getElementsByClassName("status-box")[0].value+ "</p>");
    }
    //content = "<strong>" + new_comment_elem.querySelector("input[name='report-radio']:checked").value + "</strong> " + content;

    // if a new comment is not root comment
    if (new_comment_elem.id != "root-like") {
        parent_id = new_comment_elem.parentElement.id.split("comment_")[1];
        comment_type = 2;
    } else comment_type = new_comment_elem.querySelector("input[name='comment-type']:checked").value;

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