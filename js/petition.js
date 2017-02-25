function initMap() {
    displayMap();

    displayLocationPicker();

    initTimeRangeWidget();
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

    /* Add location picker plug-in. */
    src = "js/locationpicker.jquery.js";
    script = document.createElement('script');
    script.onerror = function() {
        // handling error when loading script
        alert('Error to handle')
    }
    script.onload = function() {
        console.log(src + ' loaded ')
            // callback();

    }
    script.src = src;
    document.getElementsByTagName('head')[0].appendChild(script);
}

function submit() {
    var playersRef = firebase.database().ref("petition/" + generateID(8));

    playersRef.set({
        "title": $("#title").val(),
        "content": $("#content").val(),
        "latitude": center.lat,
        "longtitude": center.lng,
        "time-range": $('#timeRange-start').val(),
        "time-submission": new Date().toString()
    });
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