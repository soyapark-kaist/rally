var kaist = {
    lat: 36.371,
    lng: 127.3624
};
var map, center;
var infoWindow;
var viewDate = 15; // Set how many dates for 

// Data storing for drawing charts.
var APPLICATIONS = [],
    SPEED = [],
    CONSISTENCY = [];

var SLOW_TOTAL = 5,
    CONN_TOTAL = 3;

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
    firebase.initializeApp(config);
}

/* Fetch data points from DB & Push markers on the map. */
function markMap(inUserID) {
    var playersRef = firebase.database().ref('users/');
    // Attach an asynchronous callback to read the data at our posts reference
    playersRef.once("value").then(function(snapshot) {
            var users = snapshot.val();
            var locations = [];
            var activities = [];

            for (var o in users) {
                var year = o.split("-")[0],
                    month = o.split("-")[1],
                    day = parseInt(o.split("-")[2]) + 1;

                if (calculateDiffDate(new Date(year, month - 1, day), new Date()) < viewDate) {
                    for (var u in users[o]) {
                        // debugger;
                        locations.push({
                            'lat': users[o][u].latitude,
                            'lng': users[o][u].longitude
                        })

                        activities.push(u.includes("conn") ? "conn" : users[o][u].activity);
                        // console.log("here");
                        if (inUserID == u) {
                            infoWindow = new google.maps.InfoWindow({ content: "내 서명", map: map });
                            infoWindow.setPosition({
                                'lat': users[o][u].latitude + 0.001,
                                'lng': users[o][u].longitude
                            });
                        }

                    }

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

            // Add a marker clusterer to manage the markers.
            // var markerCluster = new MarkerClusterer(map, markers, {
            //     imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'
            // });

            // // markerCluster.clearMarkers();
            // // // markerCluster.refresh();
            for (var i = 0; i < markers.length; i++) {
                markers[i].setOptions({ map: map, visible: true });
            }
        },
        function(errorObject) {
            console.log("The read failed: " + errorObject.code);
        });
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

    var newUrl = window.location.href.split("rally/")[0] + "rally/timeline.html?" + p;
    window.location.replace(newUrl);
}

function routeToVis(inUserID) {
    var params = { sig: inUserID };
    var p = jQuery.param(params);

    var newUrl = window.location.href.split("rally/")[0] + "rally/visual.html?" + p;
    window.location.replace(newUrl);
}

function detectOS() {
    var userAgent = navigator.userAgent || navigator.vendor || window.opera;

    if (userAgent.match(/iPad/i) || userAgent.match(/iPhone/i) || userAgent.match(/iPod/i)) {
        return 'iOS';
    } else if (userAgent.match(/Android/i)) {
        return 'Android';
    } else if (userAgent.match(/Mac/i)) {
        return 'mac';
    } else // windows
        return 'unknown';
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

    $("#leftQuorum").text(inMax - inNow);;
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

function filterSignature(inIsSlow, inTargetHour, inTargetLoc, inQuorum) {
    var apps = {},
        speed = [0, 0, 0],
        cons = [0, 0, 0],
        download = [],
        upload = [];

    for (var o in users) {
        for (var u in users[o]) {

            if (!(inIsSlow ? !u.includes("conn") : u.includes("conn"))) //Not XOR
                continue;

            var hour = new Date(users[o][u].time).getHours();

            var hour_range = inTargetHour;
            //parseInt($('#timeRange-start').val().split(":")[0]);

            if (!filterHour(hour_range, (hour_range + 3) % 24, hour)) {
                continue;
            }

            var lat = users[o][u].latitude,
                lng = users[o][u].longitude;

            if ((Math.abs(inTargetLoc.lat - lat) <= 0.00056) && (Math.abs(inTargetLoc.lng - lng) <= 0.00056)) {
                //if ((Math.abs($('#map').locationpicker("location").latitude - lat) <= 0.00056) && (Math.abs($('#map').locationpicker("location").longitude - lng) <= 0.00056)) {
                // then include the signature
                var act = users[o][u].activity;
                if (apps[act])
                    apps[act] += 1;
                else
                    apps[act] = 1;

                speed[parseInt(users[o][u].speed) - 1]++;
                cons[parseInt(users[o][u].consistency) - 1]++;

                download.push(parseFloat(users[o][u].download));
                upload.push(parseFloat(users[o][u].upload));
            }

        }
    }

    if (download.length > 0) {
        cnt = 0, APPLICATIONS = [], SPEED = [], CONSISTENCY = [];

        /* Data preparation for application pie chart. */
        for (var d in apps) {
            APPLICATIONS.push({ "label": d, "population": apps[d] });
            cnt += apps[d];
        }

        SPEED.push({ "label": "즉각적이다", "population": speed[0] });
        SPEED.push({ "label": "클릭마다 지체가 있긴 하지만 쓸만하다", "population": speed[1] });
        SPEED.push({ "label": "새로고침을 하게 된다", "population": speed[2] });

        CONSISTENCY.push({ "label": "일정한 속도를 유지한다", "population": cons[0] });
        CONSISTENCY.push({ "label": "속도가 일정치 않아서 신경쓰이긴 하지만 쓸만하다", "population": cons[1] });
        CONSISTENCY.push({ "label": "종잡을 수 없다", "population": cons[2] });

        // Add event handler for stat navbars, call this function after data are prepared. 
        var selectors = [];
        selectors.push("#application"), selectors.push("#speed"), selectors.push("#consistency");
        var datas = [];
        datas.push(APPLICATIONS), datas.push(SPEED), datas.push(CONSISTENCY);
        initStat("#stat", selectors, datas);

        var sum = download.reduce(function(a, b) { return a + b; });
        var downAvg = sum / download.length;

        var sum = upload.reduce(function(a, b) { return a + b; });
        var upAvg = sum / upload.length;

        $("#number").text("총 " + cnt + "개");
        $("#bandwidth").text("평균 download / upload : " + downAvg + " / " + upAvg + "Mbps");
        $("#stat").css("display", "block");
        $("#speed").css("display", "none");
        $("#consistency").css("display", "none");
    } else {
        $("#number").text("해당 범위에 아직 서명이 존재하지 않습니다. 친구들에게 홍보해 더 많은 싸인을 모아보세요!");
        $("#stat").css("display", "none");
    }

    setProgressbar(cnt, inQuorum);
    $("#finalStage").css("visibility", "visible");
}



function initStat(inSelector, inSelectorList, inDataList) {
    // set active chart to first one.
    $(inSelector + " a").removeClass("active");
    $(inSelector + " a:first").addClass("active");
    drawChart(inSelectorList[0], inDataList[0]);

    $(inSelector + " a").on("click", function() {
        $(inSelector + " a").removeClass("active");
        $(this).addClass("active");

        $(inSelector + " .col-sm-8").css("display", "none");

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