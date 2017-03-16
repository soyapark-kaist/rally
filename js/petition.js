var dbLoaded = false;
var isSafari = detectBrowser();
var isSlow; // the petition is about slow ineteret or disconnection?
var SLOW_TOTAL = 3,
    CONN_TOTAL = 5;
var users;
var cnt = 0; // # of signature filtered

// Data storing for drawing charts.
var APPLICATIONS = [],
    SPEED = [],
    CONSISTENCY = [];

function initListener() {
    toggleLoading("#loading");

    $("#stat a").on("click", function() {
        $("#stat a").removeClass("active");
        $(this).addClass("active");

        $("#stat .col-sm-8").css("display", "none");
        if ($(this).text() == "인터넷 활동") {
            drawChart("#application", APPLICATIONS);
        } else if ($(this).text() == "속도 만족도") {
            drawChart("#speed", SPEED);
        } else {
            drawChart("#consistency", CONSISTENCY);
        }

    });
}

function initMap() {
    createMap();

    // displayMap();
    initLocationPicker();

    initTimeRangeWidget();

    toggleLoading("#loading");
}

function initLocationPicker() {
    /* Add location picker plug-in. */
    src = "js/locationpicker.jquery.js";
    script = document.createElement('script');
    script.onerror = function() {
        // handling error when loading script
        alert('Error to handle')
    }
    script.onload = function() {
        console.log(src + ' loaded ')

        displayLocationPicker();
    }
    script.src = src;
    document.getElementsByTagName('head')[0].appendChild(script);
}

function displayLocationPicker() {
    $('#map').locationpicker({
        location: {
            latitude: kaist.lat,
            longitude: kaist.lng
        },
        radius: 70
    }, map);
    map.setZoom(16);
}

function pickIssueType() {
    $(".issue-question button").prop('disabled', true)
        .addClass("disabled");
    return false;
}

function initTimeRangeWidget() {
    /* Add time range plug-in. */
    $('#timeRange-start').timepicker({
        'step': 60,
        'timeFormat': 'H:i'
    });

    // In case, time is selected before reload.
    if ($('#timeRange-start').val() != "")
        $("#viewSignature").prop('disabled', false);

    $('#timeRange-start').on('changeTime', function() {
        if ($(this).val() != "")
            $("#viewSignature").prop('disabled', false);
        var dstTime = (parseInt($(this).val().split(":")[0]) + 3) % 24;
        $('#timeRange-end').attr("placeholder", dstTime.toString() + ":00");
        //text($(this).val());
    });
}

function preview() {
    $("#preview").html(
        "title: " + $("#title").val() +
        "<br>content: " + $("#content").val() +
        "<br>latitude: " + $('#map').locationpicker("location").latitude +
        "<br>longitude: " + $('#map').locationpicker("location").longitude +
        "<br>time-range: " + $('#timeRange-start').val());
}

function postPetition() {
    var petitionID = generateID(8);
    var playersRef = firebase.database().ref("petition/" + petitionID);

    /* Check whether all the question are filled. */
    if (isSafari) {
        if ($("#title").val() == '') {
            // alert("시간 대를 선택해주세요.");

            $("#title").focus();
            $("#form-title").css("display", "block");
            // e.preventDefault();
            return false;
        }

        if ($("#content").val() == '') {
            // alert("시간 대를 선택해주세요.");

            $("#content").focus();
            $("#form-content").css("display", "block");
            // e.preventDefault();
            return false;
        }
    }

    playersRef.set({
        "title": $("#title").val(),
        "content": $("#content").val(),
        "latitude": $('#map').locationpicker("location").latitude,
        "longitude": $('#map').locationpicker("location").longitude,
        "time-range": $('#timeRange-start').val(),
        "time-line": {
            "submit": new Date().toString()
        }
    }, function(error) {
        if (error) {
            console.log(error);
        } else {
            // when post to DB is successful 
            routeToTimeline(petitionID);
        }

    });

    return false;
}

function selectSignature() {
    if (!dbLoaded) {
        initDB();
        dbLoaded = true;
    }

    if (isSafari) {
        if ($("#timeRange-start").val() == '') {
            alert("시간 대를 선택해주세요.");

            $("#timeRange-start").focus();

            // e.preventDefault();
            return false;
        }
    }

    var $btn = $('#viewSignature').button('loading');

    if (!users) {
        var playersRef = firebase.database().ref('users/');
        // Attach an asynchronous callback to read the data at our posts reference
        playersRef.once("value").then(function(snapshot) {
                users = snapshot.val();
                filterSignature();

                $btn.button('reset');
            },
            function(errorObject) {
                alert("The read failed: " + errorObject.code);
                $btn.button('reset');
            });
    } //If END, when DB is not yet fetched
    else {
        filterSignature();
        $btn.button('reset');
    } //else END, when DB is already fetched

    return false;
}

function filterSignature() {
    var apps = {},
        speed = [0, 0, 0],
        cons = [0, 0, 0],
        download = [],
        upload = [];

    for (var o in users) {
        for (var u in users[o]) {
            var hour = new Date(users[o][u].time);
            hour = hour.getHours();

            var hour_range = $('#timeRange-start').val().split(":")[0];
            if (!(hour_range <= hour && hour < hour_range + 3)) {
                continue;
            }

            var lat = users[o][u].latitude,
                lng = users[o][u].longitude;

            if ((Math.abs($('#map').locationpicker("location").latitude - lat) <= 0.00056) && (Math.abs($('#map').locationpicker("location").longitude - lng) <= 0.00056)) {
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

        // set active chart to first one.
        $("#stat a").removeClass("active");
        $("#stat a:first").addClass("active");
        drawChart("#application", APPLICATIONS);

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

    setProgressbar();
    $("#finalStage").css("visibility", "visible");
}

function setProgressbar() {
    // aria-valuenow="40" aria-valuemin="0" aria-valuemax="100"
    if (isSlow) {
        $(".progress-bar").css("width", (cnt / SLOW_TOTAL * 100) + "%").attr("aria-valuenow", cnt);
        $(".progress-bar").attr("aria-valuemax", SLOW_TOTAL);
    } else {
        $(".progress-bar").css("width", (cnt / CONN_TOTAL * 100) + "%").attr("aria-valuenow", cnt);
        $(".progress-bar").attr("aria-valuemax", CONN_TOTAL);
    }
}