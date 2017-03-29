var userID;
var pos;

function initVis() {
    toggleLoading("#loading");
    infoWindow = new google.maps.InfoWindow({ map: map });
    infoWindow.close();



    var bldgRef = firebase.database().ref("bldg/");
    // Attach an asynchronous callback to read the data at our posts reference
    bldgRef.once("value").then(function(snapshot) {
        var bldgs = snapshot.val();
        var bounds = new google.maps.LatLngBounds();

        for (var p in bldgs) {
            p = parseInt(p);

            if (bldgs[p].open == "true")
                $('.table-inbox tbody').append(
                    '<tr onclick="window.document.location=\'./timeline.html?id=' + bldgs[p].url + '\';">\
            <td>' + bldgs[p].name + '</td>\
          </tr>'
                );

            // Add the circle for the petition to the map.
            var marker = createMarker(bldgs[p].url, { lat: bldgs[p].lat, lng: bldgs[p].lng }, bldgs[p].name);
            bounds.extend({ lat: bldgs[p].lat, lng: bldgs[p].lng });

            marker.addListener('click', function(e) {
                infoWindow.open(map);
                infoWindow.setContent(this.title + " <a class='btn btn-primary' href='./timeline.html?id=" + this.petitionID + "'>자세히 보기</a>");
                infoWindow.setPosition(this.getPosition())
            });
        }

        map.fitBounds(bounds);

        toggleLoading("#loading");
    });

}

function getUserID() {
    var params = window.location.search.substring(1).split("&");
    for (var p in params) {
        if (params[p].split("=")[0] == "sig")
            userID = params[p].split("=")[1];
    }
    return userID;
}

/* Fetch petitions. */
function fetchPetiton(inUser, inCallback) {
    var playersRef = firebase.database().ref('petition/');
    // Attach an asynchronous callback to read the data at our posts reference
    playersRef.once("value").then(function(snapshot) {
        var petitions = snapshot.val();
        var p = [];

        for (var o in petitions) {
            var hour = new Date(inUser.time);
            hour = hour.getHours();

            var hour_from = TIME_RANGE[parseInt(petitions[o]["time-range"])].from,
                hour_to = TIME_RANGE[parseInt(petitions[o]["time-range"])].to;
            if (!filterHour(hour_from, hour_to, hour)) {
                continue;
            }

            var lat = petitions[o].latitude,
                lng = petitions[o].longitude;

            if ((Math.abs(inUser.latitude - lat) <= 0.00056) && (Math.abs(inUser.longitude - lng) <= 0.00056)) {
                // then include the petition
                p.push({
                    'id': o,
                    'title': petitions[o].title,
                    'content': petitions[o].content,
                    'time-range': petitions[o]["time-range"]
                });
            }
        }

        inCallback(p);
    });
}

function displayPetitions(inPetitions) {

}


function initMap() {
    createMap();
    initDB();
    markMap(getUserID());

    centerMap();


}

function centerMap() {
    map.setCenter(kaist);
}