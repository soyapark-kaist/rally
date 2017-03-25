var userID;
var pos;

function initVis() {
    toggleLoading("#loading");
    var playersReff = firebase.database().ref("petition/");
    infoWindow = new google.maps.InfoWindow({ map: map });
    infoWindow.close();

    // Attach an asynchronous callback to read the data at our posts reference
    playersReff.on("value", function(snapshot) {
            var users = snapshot.val();
            var datas = {},
                download = [],
                upload = [];

            /* before append, remove previously added rows. */
            $('.table-inbox tbody').empty()

            for (var o in users) {
                if (users[o]["time-line"]["erase"]) continue;
                var submitDate = new Date(users[o]["time-line"]["submit"]);
                var passed = new Date() > submitDate.setDate(submitDate.getDate() + 1);

                var progress = "";

                appendRow(o, users[o].title, users[o]["time-line"]["submit"].split(" GMT")[0], MSG_PROGRESS[getProgress(users[o]["time-line"])]);

                // Add the circle for the petition to the map.
                var cityCircle = createCircle(o, { lat: users[o].latitude, lng: users[o].longitude }, users[o].title);

                cityCircle.addListener('click', function(e) {
                    infoWindow.open(map);
                    infoWindow.setContent(this.title + " <a class='btn btn-primary' href='./timeline.html?id=" + this.petitionID + "'>자세히 보기</a>");
                    infoWindow.setPosition(this.getCenter())
                });
            }

            toggleLoading("#loading");
        },
        function(errorObject) {
            alert("The read failed: " + errorObject.code);
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