// Firebase app
var app;

var kaist = {
    lat: 36.371,
    lng: 127.3624
};
var map, center;
var infoWindow;
var viewDate = 1.1; // Set how many dates for

// Data storing for drawing charts.
var APPLICATIONS = [],
    SPEED = [],
    CONSISTENCY = [];

// Number of quorum
var SLOW_TOTAL = 5,
    CONN_TOTAL = 3;

var QUORUM_TOTAL = 10;

/* Initialize map. */
function createMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 15
    });
}
/* Initialize Firebase. */
function initDB() {
    var config = {
        apiKey: "AIzaSyD9v41gd511lFHseGqCXwNyfpQyArNgZLQ",
        authDomain: "hello-3239c.firebaseapp.com",
        databaseURL: "https://hello-3239c.firebaseio.com",
        storageBucket: "hello-3239c.appspot.com",
        messagingSenderId: "785081542704"
    };
    app = firebase.initializeApp(config);
}

/* Fetch data points from DB & Push markers on the map. */
function markMap(inUserID) {
    var playersRef = firebase.database().ref('users/' + [new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()].join("-"));
    // Attach an asynchronous callback to read the data at our posts reference
    playersRef.once("value").then(function(snapshot) {
            var users = snapshot.val();
            var locations = [];
            var activities = [];

            for (var o in users) {
                locations.push({
                    'lat': users[o].latitude,
                    'lng': users[o].longitude
                })

                activities.push(o.indexOf("conn") != -1 ? "conn" : users[o].activity);
                // console.log("here");
                if (inUserID == o) {
                    infoWindow = new google.maps.InfoWindow({ content: "내 서명", map: map });
                    infoWindow.setPosition({
                        'lat': users[o].latitude + 0.001,
                        'lng': users[o].longitude
                    });
                }
            }

            // Create an array of alphabetical characters used to label the markers.
            var labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

            var markers = locations.map(function(location, i) {
                var image = {
                    url: 'img/activity/' + activities[i] + '.png',
                    scaledSize: new google.maps.Size(30, 30)
                };
                return new google.maps.Marker({
                    position: location,
                    activity: activities[i],
                    icon: image
                });
            });

            for (var i = 0; i < markers.length; i++) {
                markers[i].setOptions({ map: map, visible: true });
            }
        },
        function(errorObject) {
            console.log("The read failed: " + errorObject.code);
        });
}

function initLegend() {
    var legend = document.getElementById('legend');
    var activities = [
        { name: "작동 안함", icon: "conn" },
        { name: "웹 컨퍼런싱", icon: "conferencing" },
        { name: "페이스북", icon: "facebook" },
        { name: "파일 업로드/다운로드", icon: "file" },
        { name: "카이스트 포탈 등", icon: "kaist" },
        { name: "뮤직 스트리밍", icon: "music" },
        { name: "트위터", icon: "twitter" },
        { name: "비디오 스트리밍", icon: "video" },
        { name: "웹 브라우징", icon: "web" },
    ]
    for (var act in activities) {
        var name = activities[act].name;
        var icon = "./img/activity/" + activities[act].icon + ".png";
        var div = document.createElement('div');
        div.innerHTML = '<img src="' + icon + '"> ' + name;
        legend.appendChild(div);
    }
    map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(document.getElementById('legend'));
}

function fill_progress_circle(cid /* integer 0~4*/ ) {
    var circle_selector = ".timeline-progress .fa-circle:eq(" + cid + ")";
    $(circle_selector).css("color", "#ff6c40")
}

/* Error Handler when current location is not detectable. */
function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow = new google.maps.InfoWindow({ map: map });
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
        '브라우저의 위치정보 수집이 불가합니다. 설정에서 승인 후 다시 시도해주세요.' :
        '브라우저의 위치정보 수집이 불가합니다. 다른 브라우저에서 다시 시도해주세요.'
    );
}

/* Randomly generate unique ID. */
function generateID(inLength) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < inLength; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

/* Get difference between two dates. */
function calculateDiffDate(inDate1, inDate2) {
    return Math.ceil(Math.abs(inDate1.getTime() - inDate2.getTime()) / (1000 * 3600 * 24));
}

function routeToTimeline(inPetitionID, isAdmin) {
    var params = isAdmin ? { adn: true, id: inPetitionID } : { id: inPetitionID };
    var p = jQuery.param(params);

    var newUrl = "./timeline.html" + "?" + p;
    window.location.replace(newUrl);
}

function routeToVis(inUserID) {
    var params = { sig: inUserID };
    var p = jQuery.param(params);

    var newUrl = "./visual.html?" + p;
    window.location.replace(newUrl);
}

function detectOS() {
    var userAgent = navigator.userAgent || navigator.vendor || window.opera;

    if (userAgent.match(/Windows/i)) {
        return 'windows';
    } else if (userAgent.match(/Android/i)) {
        return 'android';
    } else if (userAgent.match(/Macintosh/i)) {
        return 'mac';
    } else // Leave ios as default os
        return 'ios';
}

function detectBrowser() {
    var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    return isSafari;
}

function fromLatLngToPoint(latLng) {
    var topRight = map.getProjection().fromLatLngToPoint(map.getBounds().getNorthEast());
    var bottomLeft = map.getProjection().fromLatLngToPoint(map.getBounds().getSouthWest());
    var scale = Math.pow(2, map.getZoom());
    var worldPoint = map.getProjection().fromLatLngToPoint(latLng);
    return new google.maps.Point((worldPoint.x - bottomLeft.x) * scale, (worldPoint.y - topRight.y) * scale);
}

function toggleLoading(inSelector) {
    $(inSelector).toggleClass("loader");
}

function setProgressbar(inNow, inMax) {
    // aria-valuenow="40" aria-valuemin="0" aria-valuemax="100"
    $(".progress-bar").css("width", (inNow / inMax * 100) + "%").attr("aria-valuenow", inNow);
    $(".progress-bar").attr("aria-valuemax", inMax);

    $("#leftQuorum").text(parseInt(QUORUM_TOTAL - inNow));
}

function createMarker(inID, inCenter, inTitle, inRate) {
    return new google.maps.Marker({
        position: new google.maps.LatLng(inCenter.lat, inCenter.lng),
        map: map,
        petitionID: inID,
        title: inTitle,
        rate: inRate
    });
}

function createCircle(inID, inCenter, inTitle) {
    return new google.maps.Circle({
        strokeColor: '#FF0000',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#FF0000',
        fillOpacity: 0.35,
        map: map,
        center: { lat: inCenter.lat, lng: inCenter.lng },
        radius: 70,
        petitionID: inID,
        title: inTitle
    });
}

function filterHour(hour_from, hour_to, hour3) {
    if (hour_from == hour_to) {
        return hour_to == hour3;
    } else if (hour_from < hour_to) {
        return hour_from <= hour3 && hour3 < hour_to;
    } else {
        return hour3 >= hour_from || hour3 < hour_to;
    }
}

var conn = {
        "strength": [0, 0, 0, 0, 0], // 0, 25 ... 100%
        "cnt": 0
    },
    slow = {
        "apps": {},
        "speed": [0, 0, 0, 0],
        "cons": [0, 0, 0, 0],
        "download": [],
        "upload": [],
        "cnt": 0
    }

function filterSignature(inTargetDate, inBldgIdx, inQuorum) {
    var now = new Date();
    var dateRange = [];

    for (var d = inTargetDate; d <= now; d.setDate(d.getDate() + 1)) {
        // console.log([d.getFullYear(), d.getMonth() + 1, d.getDate()].join("-"));
        dateRange.push([d.getFullYear(), d.getMonth() + 1, d.getDate()].join("-"));
    }

    fetchSignature(0, dateRange, inBldgIdx, inQuorum);
}

function fetchSignature(inDateIndex, inDateRange, inBldgIdx, inQuorum) {
    if (inDateIndex == inDateRange.length) {
        if (conn["cnt"] + slow["cnt"] > 0) {
            drawChart("#issue-chart", [{ "label": "느린 인터넷", "population": slow["cnt"] },
                { "label": "연결 불능", "population": conn["cnt"] }
            ]);

            APPLICATIONS = [], SPEED = [], CONSISTENCY = [];

            if (conn["cnt"] > 0) {
                var c = [];
                for (var i = 0; i < conn["strength"].length; i++) {
                    c.push({ "label": WIFI_STRENGTH_MSG[i], "population": conn["strength"][i] });

                }

                drawChart("#strength-chart", c);
            }
            if (slow["cnt"] > 0) {
                /* Data preparation for application pie chart. */
                for (var d in slow["apps"]) {
                    APPLICATIONS.push({ "label": d, "population": slow["apps"][d] });
                }

                SPEED.push({ "label": "즉각적이다", "population": slow["speed"][0] });
                SPEED.push({ "label": "지연을 느낌", "population": slow["speed"][1] });
                SPEED.push({ "label": "원하는만큼 못 사용", "population": slow["speed"][2] });
                SPEED.push({ "label": "응답없음", "population": slow["speed"][3] });

                CONSISTENCY.push({ "label": "일정함", "population": slow["cons"][0] });
                CONSISTENCY.push({ "label": "쓸만함", "population": slow["cons"][1] });
                CONSISTENCY.push({ "label": "불안정", "population": slow["cons"][2] });

                // Add event handler for stat navbars, call this function after data are prepared.
                var selectors = [];
                selectors.push("#application"), selectors.push("#speed"), selectors.push("#consistency");
                var datas = [];
                datas.push(APPLICATIONS), datas.push(SPEED), datas.push(CONSISTENCY);
                drawChart("#application", APPLICATIONS);
                drawChart("#speed", SPEED);
                drawChart("#consistency", CONSISTENCY);
                // initStat("#stat", selectors, datas);

                var sum = slow["download"].reduce(function(a, b) { return a + b; });
                var downAvg = sum / slow["download"].length;

                var sum = slow["upload"].reduce(function(a, b) { return a + b; });
                var upAvg = sum / slow["upload"].length;

                $("#bandwidth").text("평균 download / upload : " + downAvg.toFixed(2) + " / " + upAvg.toFixed(2) + "Mbps");
            }

            $("#number").text("제보 총 " + (conn["cnt"] + slow["cnt"]) + "개");

            $("#stat").css("display", "block");
        } else {
            $("#number").text("해당 건물에 아직 제보한 사람이 없습니다. 친구들에게 홍보해 더 많은 힘을 모아보세요!");
        }

        if (conn["cnt"] + slow["cnt"] >= QUORUM_TOTAL) {
            $("#leftQuorum").hide();
            $("#leftQuorum2").hide();
        }
        setProgressbar(conn["cnt"] + slow["cnt"] > QUORUM_TOTAL ? QUORUM_TOTAL : conn["cnt"] + slow["cnt"], QUORUM_TOTAL);
        $("#finalStage").css("visibility", "visible");

        return;
    }

    var playersRef = firebase.database().ref('users/' + inDateRange[inDateIndex]);
    // Attach an asynchronous callback to read the data at our posts reference
    playersRef.once("value").then(function(snapshot) {
            var users = snapshot.val();

            for (var o in users) {
                var loc = users[o].bldg;

                if (inBldgIdx == loc) {
                    //if ((Math.abs($('#map').locationpicker("location").latitude - lat) <= 0.00056) && (Math.abs($('#map').locationpicker("location").longitude - lng) <= 0.00056)) {
                    // then include the signature

                    if (o.indexOf("conn") != -1) {
                        // Get welcome kaist strength
                        conn["strength"][parseInt(users[o]["welcome_kaist"]) / 25]++;
                        conn["cnt"]++;

                        // appendConnRow(users[o].email, users[o].time, users[o].room, users[o].ip_addr, users[o].os, users[o].web, users[o].type, users[o]["welcome_kaist"]);
                    } else {
                        var act = users[o].activity;
                        if (slow["apps"][act]) slow["apps"][act] += 1;
                        else
                            slow["apps"][act] = 1;

                        slow["speed"][parseInt(users[o].speed) - 1]++;
                        slow["cons"][parseInt(users[o].consistency) - 1]++;

                        slow["download"].push(parseFloat(users[o].download));
                        slow["upload"].push(parseFloat(users[o].upload));
                        slow["cnt"]++;
                    }
                }
            }

            fetchSignature(++inDateIndex, inDateRange, inBldgIdx, inQuorum);
        },
        function(errorObject) {
            alert("The read failed: " + errorObject.code);
            // $btn.button('reset');
        });


}

function initStat(inSelector, inSelectorList, inDataList) {
    // set active chart to first one.
    $(inSelector + " a").removeClass("active");
    $(inSelector + " a:first").addClass("active");
    drawChart(inSelectorList[0], inDataList[0]);

    $(inSelector + " a").on("click", function() {
        $(inSelector + " a").removeClass("active");
        $(this).addClass("active");

        drawChart(inSelectorList[$(this).index()], inDataList[$(this).index()]);
        // if ($(this).text() == "인터넷 활동") {
        //     drawChart("#application", APPLICATIONS);
        // } else if ($(this).text() == "속도 만족도") {
        //     drawChart("#speed", SPEED);
        // } else {
        //     drawChart("#consistency", CONSISTENCY);
        // }

    });
}

function appendRow(inID, inTitle, inDate, inProgress) {
    $('.table-inbox tbody').append(
        '<tr onclick="window.document.location=\'./timeline.html?id=' + inID + '\';">\
            <td>' + inTitle + '</td>\
            <td>' + inDate + '</td>\
            <td>' + inProgress + '</td>\
          </tr>'
    );
}

function getProgress(inTimeline) {
    var submitDate = new Date(inTimeline["submit"]);
    if (inTimeline["erase"])
        return "폐기"

    else if (inTimeline["respond"])
        return 4;

    else if (inTimeline["sent"])
        return 3;

    else if (new Date() < (d = submitDate.setDate(submitDate.getDate() + 1))) return 1;

    else return 2;
}

var trackOutboundLink = function(url, inCategory) {
    ga('send', 'event', inCategory, 'click', url, {
        'transport': 'beacon',
        'hitCallback': function() {
            document.location = url;
        }
    });
}

// function calcTime(city, offset) {
//     // create Date object for current location
//     var d = new Date();

//     // convert to msec
//     // subtract local time zone offset
//     // get UTC time in msec
//     var utc = d.getTime() - (d.getTimezoneOffset() * 60000);

//     // create new Date object for different city
//     // using supplied offset
//     var nd = new Date(utc + (3600000 * offset));

//     // return time as a string
//     return "The local time for city" + city + " is " + nd.toLocaleString();
// }