var userID;
var pos;

function initVis() {
    var params = window.location.search.substring(1).split("&");
    for (var p in params) {
        if (params[p].split("=")[0] == "sig")
            userID = params[p].split("=")[1];
    }

    var playersRef = firebase.database().ref('users/');
    playersRef.once("value").then(function(snapshot) {
        var users = snapshot.val();
        var isExist = false;

        for (var o in users) {
            if (users[o][userID]) {
                isExist = true;
                pos = {
                    lat: users[o][userID].latitude,
                    lng: users[o][userID].longitude
                };
                break;
            }
        }

        if (!isExist) {
            alert("존재하지 않은 데이터 서명입니다!")
            return;
        }

        fetchPetiton(users[o][userID]);
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
function fetchPetiton(inUser) {
    var playersRef = firebase.database().ref('petition/');
    // Attach an asynchronous callback to read the data at our posts reference
    playersRef.once("value").then(function(snapshot) {
        var petitions = snapshot.val();
        var petitions = [];

        for (var o in petitions) {
            var hour = new Date(inUser.time);
            hour = hour.getHours();

            var hour_range = parseInt(petitions[o]["time-range"].split(":")[0]);
            if (!(hour_range <= hour && hour < hour_range + 3)) {
                continue;
            }

            var lat = petitions[o].latitude,
                lng = petitions[o].longitude;

            if ((Math.abs(inUser.latitude - lat) <= 0.0016) && (Math.abs(inUser.longitude - lng) <= 0.0016)) {
                // then include the petition
                petitions.push({
                    'id': o,
                    'title': petitions[o].title,
                    'content': petitions[o].content,
                    'time-range': petitions[o]["time-range"]
                });
            }
        }
    });
}


function initMap() {
    createMap();
    initDB();
    fetchMap(getUserID());

    centerMap();


}

function centerMap() {
    map.setCenter(kaist);
}