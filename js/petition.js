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

function selectSignature() {
    var playersRef = firebase.database().ref('users/');
    // Attach an asynchronous callback to read the data at our posts reference
    playersRef.on("value", function(snapshot) {
            var users = snapshot.val();
            var datas = [];

            for (var o in users) {
                var lat = users[o].latitude,
                    lng = users[o].longitude;

                if ((Math.abs($('#map').locationpicker("location").latitude - lat) <= 0.001) && (Math.abs($('#map').locationpicker("location").longitude - lng) <= 0.001)) {
                    // then include the signature
                    datas.push(users[o]);
                }

                console.log(users[o])
                console.log(users[o].activity)
            }

            console.log(datas);
        },
        function(errorObject) {
            console.log("The read failed: " + errorObject.code);
        });
    // 0.001



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
    initDB();

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
        // Callback comes here
        if (error) {
            console.log(error);
        } else {
            var params = { id: petitionID };
            var p = jQuery.param(params);

            var newUrl = window.location.href.split("rally/")[0] + "rally/timeline.html?" + p;
            window.location.replace(newUrl);
        }

    });

    selectSignature();


    // alert("탄원서가 정보통신팀에 제출되었습니다!");
}

function initTimeRangeWidget() {
    /* Add time range plug-in. */
    $('#timeRange-start').timepicker({
        'step': 60,
        'timeFormat': 'H:i'
    });
    $('#timeRange-start').on('changeTime', function() {
        var dstTime = (parseInt($(this).val().split(":")[0]) + 3) % 24;
        $('#timeRange-end').attr("placeholder", dstTime.toString() + ":00");
        //text($(this).val());
    });
}