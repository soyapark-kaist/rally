var dbLoaded = false;

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
    // Try HTML5 geolocation.
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            center = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            $('#map').locationpicker({
                location: {
                    latitude: center.lat,
                    longitude: center.lng
                },
                radius: 200
            }, map);
            map.setZoom(16);

            // infoWindow.setPosition(pos);
            // infoWindow.setContent('Location found.');
        }, function() {
            handleLocationError(true, infoWindow, map.getCenter());
        });
    } else {
        // Browser doesn't support Geolocation
        handleLocationError(false, infoWindow, map.getCenter());
    }
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

    selectSignature();
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
            var datas = {};

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

                    if ((Math.abs($('#map').locationpicker("location").latitude - lat) <= 0.0014) && (Math.abs($('#map').locationpicker("location").longitude - lng) <= 0.0014)) {
                        // then include the signature
                        var act = users[o][u].activity;
                        if (datas[act])
                            datas[act] += 1;
                        else
                            datas[act] = 1;
                    }

                }
            }

            console.log(datas);
            var m = [],
                cnt = 0;
            for (var d in datas) {
                m.push({ "label": d, "population": datas[d] });
                cnt += datas[d];
            }
            $("#number").text("총 " + cnt + "개");
            drawChart("#application", m);

            $btn.button('reset');
            $("#stat").css("display", "block");
            $("#finalStage").css("visibility", "visible");
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
        $("#viewSignature").removeClass("disabled");

    $('#timeRange-start').on('changeTime', function() {
        if ($(this).val() != "")
            $("#viewSignature").removeClass("disabled");
        var dstTime = (parseInt($(this).val().split(":")[0]) + 3) % 24;
        $('#timeRange-end').attr("placeholder", dstTime.toString() + ":00");
        //text($(this).val());
    });
}