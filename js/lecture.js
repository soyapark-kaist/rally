var entire_download = 0.0,
    entire_download_cnt = 0,
    entire_upload = 0.0,
    entire_upload_cnt = 0;

$(function() {
    // Show loading spinner
    toggleFixedLoading(".loading");
    
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

    drawBarChart();

    /* Flow: fb sdk install / fetch comments from DB then append and bind events -> check login status. */
    fetchComments();
    init_comments();
    init_lecture_comments();
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

    $("body").on("appended", ".comment-progressbar", function(event) {
        //event after append the element into DOM, do anything
        drawProgressBar($(this));
    });
}