var dbLoaded = false;

function initListener() {
    $("#move-title").click(function(e) {
        $("html, body").animate({
            scrollTop: $("#question-title").position().top
        }, 1500);
    })

    $("#move-content").click(function(e) {
        $("html, body").animate({
            scrollTop: $("#question-content").position().top
        }, 1500);
    })
}

function initMap() {
    createMap();

    // displayMap();
    initLocationPicker();

    initTimeRangeWidget();
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
        radius: 200
    }, map);
    map.setZoom(16);
}

function preview() {
    $("#preview").html(
        "title: " + $("#title").val() +
        "<br>content: " + $("#content").val() +
        "<br>latitude: " + $('#map').locationpicker("location").latitude +
        "<br>longitude: " + $('#map').locationpicker("location").longitude +
        "<br>time-range: " + $('#timeRange-start').val());
}

function submit() {
    var petitionID = generateID(8);
    var playersRef = firebase.database().ref("petition/" + petitionID);

    /* Check whether all the question are filled. */
    var isValid = true;

    if ($("#title").val() == "") {
        $("#form-title").css("display", "block");
        isValid = false;
    }

    if ($("#content").val() == "") {
        $("#form-content").css("display", "block");
        isValid = false;
    }

    if (!isValid) return;

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
}

function selectSignature() {
    if (!dbLoaded) {
        initDB();
        dbLoaded = true;
    }

    var $btn = $('#viewSignature').button('loading');

    var playersRef = firebase.database().ref('users/');
    // Attach an asynchronous callback to read the data at our posts reference
    playersRef.on("value", function(snapshot) {
            var users = snapshot.val();
            var datas = {},
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

                    if ((Math.abs($('#map').locationpicker("location").latitude - lat) <= 0.0016) && (Math.abs($('#map').locationpicker("location").longitude - lng) <= 0.0016)) {
                        // then include the signature
                        var act = users[o][u].activity;
                        if (datas[act])
                            datas[act] += 1;
                        else
                            datas[act] = 1;

                        download.push(parseFloat(users[o][u].download));
                        upload.push(parseFloat(users[o][u].upload));
                    }

                }
            }

            if (download.length > 0) {
                /* Data preparation for application pie chart. */
                var m = [],
                    cnt = 0;
                for (var d in datas) {
                    m.push({ "label": d, "population": datas[d] });
                    cnt += datas[d];
                }

                drawChart("#application", m);

                var sum = download.reduce(function(a, b) { return a + b; });
                var downAvg = sum / download.length;

                var sum = upload.reduce(function(a, b) { return a + b; });
                var upAvg = sum / upload.length;

                $("#number").text("총 " + cnt + "개");
                $("#bandwidth").text("평균 download / upload : " + downAvg + " / " + upAvg + "Mbps");
                $("#stat").css("display", "block");
            } else {
                $("#number").text("해당 범위에 아직 서명이 존재하지 않습니다. 친구들에게 홍보해 더 많은 싸인을 모아보세요!");
                $("#stat").css("display", "none");
            }

            $("#finalStage").css("visibility", "visible");
            $btn.button('reset');
        },
        function(errorObject) {
            alert("The read failed: " + errorObject.code);
            $btn.button('reset');
        });
}

function routeToTimeline(inPetitionID) {
    var params = { id: inPetitionID };
    var p = jQuery.param(params);

    var newUrl = window.location.href.split("rally/")[0] + "rally/timeline.html?" + p;
    window.location.replace(newUrl);
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