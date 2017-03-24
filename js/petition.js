var dbLoaded = false;
var isSafari = detectBrowser();
var isSlow; // the petition is about slow ineteret or disconnection?
var users;
var filteredCnt = 0; // # of signature filtered
var petitionID = generateID(8);

$(function() {
    $('[data-toggle="tooltip"]').tooltip()
})

function initListener() {
    toggleLoading("#loading");

    fill_progress_circle(0);

    initDB();
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

function pickIssueType(t) {
    $(".issue-question button").prop('disabled', true)
        .addClass("disabled");
    isSlow = t;

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

    var lat, lng;
    ($('#location :selected').val() == -1) ?
    (lat = $('#map').locationpicker("location").latitude, lng = $('#map').locationpicker("location").longitude) :
    (lat = BLDG[$('#location :selected').text()].lat, lng = BLDG[$('#location :selected').text()].lng)

    //then save input to local storage

    // Check whether the user is authenticated
    var user = firebase.auth().currentUser;

    // User is signed in.
    if (user) {
        //route to timeline.html
        var playersRef = firebase.database().ref("petition/" + petitionID);

        playersRef.set({
                "title": $("#title").val(),
                "content": $("#content").val(),
                "latitude": lat,
                "longitude": lng,
                "time-range": $("input[name='time-range']:checked").val(),
                "day-range": $("input[name='day-range']:checked").val(),
                "time-line": {
                    "submit": new Date().toString()
                },
                "quorum": isSlow ? SLOW_TOTAL : CONN_TOTAL,
                "email": user.email
            },
            function(error) {
                if (error) {
                    console.log(error);
                } else {
                    // when post to DB is successful 
                    routeToTimeline(petitionID);
                }

            });
    }
    // No user is signed in.
    else {
        //then route to login page(login.html)
        //route to login.html
        localStorage.setItem("petitionID", petitionID);
        localStorage.setItem("title", $("#title").val());
        localStorage.setItem("content", $("#content").val());
        localStorage.setItem("latitude", lat);
        localStorage.setItem("longitude", lng);
        localStorage.setItem("time-range", $("input[name='time-range']:checked").val());
        localStorage.setItem("day-range", $("input[name='day-range']:checked").val());
        localStorage.setItem("submit", new Date().toString());
        localStorage.setItem("quorum", isSlow ? SLOW_TOTAL : CONN_TOTAL);

        window.location.replace("./login.html");
        return false;
    }

    return false;
}

function selectSignature() {
    if (!$(".issue-type .disabled").length) {
        alert("인터넷 문제를 선택해주세요.");

        $(".issue-type button").focus();

        return false;
    }

    if (isSafari) {
        if ($("input[name='time-range']:checked").length == 0) {
            alert("시간 대를 선택해주세요.");
            $("input[name='time-range']").focus();
            // e.preventDefault();
            return false;
        }

        if ($("input[name='day-range']:checked").length == 0) {
            alert("어느 날에 일어나는지 선택해주세요.");
            $("input[name='day-range']").focus();
            // e.preventDefault();
            return false;
        }
    }

    var $btn = $('#viewSignature').button('loading');
    var selectedLoc = {
        "lat": $('#map').locationpicker("location").latitude,
        "lng": $('#map').locationpicker("location").longitude
    };

    var bldg = [];
    for (var l in BLDG) {
        if (Math.abs(selectedLoc.lat - BLDG[l].lat) < 0.002 && Math.abs(selectedLoc.lng - BLDG[l].lng) < 0.002) {
            bldg.push(l);
        }
    }
    console.log(bldg);
    $('#location select').remove();
    if (bldg.length > 0) {
        var s = $('<select />');

        $('<option />', { value: -1, text: "혹시 이 건물에 계신가요?" }).appendTo(s);
        for (var val in bldg) {
            $('<option />', { value: val, text: bldg[val] }).appendTo(s);
        }

        s.appendTo('#location'); // or wherever it should be
    }

    $("#finalStage").css("visibility", "visible");

    /*
        if (!users) {
            var playersRef = firebase.database().ref('users/');
            // Attach an asynchronous callback to read the data at our posts reference
            playersRef.once("value").then(function(snapshot) {
                    users = snapshot.val();
                    filterSignature(
                        isSlow,
                        parseInt($('#timeRange-start').val().split(":")[0]), {
                            "lat": $('#map').locationpicker("location").latitude,
                            "lng": $('#map').locationpicker("location").longitude
                        },
                        isSlow ? SLOW_TOTAL : CONN_TOTAL);

                    $btn.button('reset');
                },
                function(errorObject) {
                    alert("The read failed: " + errorObject.code);
                    $btn.button('reset');
                });
        } //If END, when DB is not yet fetched
        else {
            filterSignature(
                isSlow,
                parseInt($('#timeRange-start').val().split(":")[0]), {
                    "lat": $('#map').locationpicker("location").latitude,
                    "lng": $('#map').locationpicker("location").longitude
                },
                isSlow ? SLOW_TOTAL : CONN_TOTAL);
            $btn.button('reset');
        } //else END, when DB is already fetched
        */

    $btn.button('reset');
    return false;
}