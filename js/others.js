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

        var playersRef = firebase.database().ref('users/');
        // Attach an asynchronous callback to read the data at our posts reference
        playersRef.once("value").then(function(snapshot) {

                // [0,0 ..]
                var bldgRate = new Array(Object.keys(bldgs).length + 1).join('0').split('').map(parseFloat);
                users = snapshot.val();

                var openDateRef = firebase.database().ref('opendate/');
                openDateRef.once("value").then(function(snapshot) {
                    for (var o in users) {
                        var year = o.split("-")[0],
                            month = parseInt(o.split("-")[1]) - 1,
                            day = parseInt(o.split("-")[2]);

                        var date = new Date();
                        date.setFullYear(year);
                        date.setMonth(month);
                        date.setDate(day);

                        // fetch data which registered after opendate
                        if (new Date(snapshot.val()) > date) {
                            continue;
                        }

                        for (var u in users[o]) {
                            bldgRate[parseInt(users[o][u].bldg)]++;
                        }
                    }


                    var bounds = new google.maps.LatLngBounds();
                    var tableRows = [];

                    for (var p in bldgs) {
                        p = parseInt(p);

                        bldgs[p].headcnt = bldgs[p].headcnt ? bldgs[p].headcnt : 100;

                        tableRows.push({ "url": bldgs[p].url, "name": bldgs[p].name, "rate": bldgRate[p] });

                        // Add the circle for the petition to the map.
                        var marker = createMarker(bldgs[p].url, { lat: bldgs[p].lat, lng: bldgs[p].lng }, bldgs[p].name, bldgRate[p]);
                        bounds.extend({ lat: bldgs[p].lat, lng: bldgs[p].lng });


                        marker.addListener('click', function(e) {
                            infoWindow.open(map);
                            infoWindow.setContent(this.title + " (" + this.rate + "명) <a class='btn btn-primary' href='./timeline.html?id=" + this.petitionID + "&sharing=true'>자세히 보기</a>");
                            infoWindow.setPosition(this.getPosition())
                        });
                    }

                    tableRows = tableRows.sort(function(a, b) { return (a.rate < b.rate) ? 1 : ((b.rate < a.rate) ? -1 : 0); });

                    for (var i = 0; i < 5; i++) {
                        $('.table-inbox tbody').append(
                            '<tr onclick="window.document.location=\'./timeline.html?sharing=true&id=' + tableRows[i].url + '\';">\
                            <td>' + "#" + (i + 1) + " " + tableRows[i].name + ' (' + tableRows[i].rate + '명)' + '</td>\
                            </tr>'
                        );
                    }


                    map.fitBounds(bounds);

                    toggleLoading("#loading");
                });
            },
            function(errorObject) {
                alert("The read failed: " + errorObject.code);
                // $btn.button('reset');
            });
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