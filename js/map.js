var userID;

function initVis() {
    var params = window.location.search.substring(1).split("&");
    for (var p in params) {
        if (params[p].split("=")[0] == "sig")
            userID = params[p].split("=")[1];
    }

    var playersRef = firebase.database().ref('users/');
    playersRef.on("value", function(snapshot) {
        var users = snapshot.val();
        var isExist = false;

        for (var o in users) {
            if (users[o][userID]) {
                isExist = true;
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

/* Fetch petitions. */
function fetchPetiton(inUser) {
    var playersRef = firebase.database().ref('petition/');
    // Attach an asynchronous callback to read the data at our posts reference
    playersRef.on("value", function(snapshot) {
            var users = snapshot.val();
            var petitions = [];

            for (var o in users) {
                var hour = new Date(inUser.time);
                hour = hour.getHours();

                var hour_range = parseInt($('#timeRange-start').val().split(":")[0]);
                if (!(hour_range <= hour && hour < hour_range + 3)) {
                    continue;
                }

                var lat = users[o].latitude,
                    lng = users[o].longitude;

                if ((Math.abs(inUser.latitude - lat) <= 0.0016) && (Math.abs(inUser.longitude - lng) <= 0.0016)) {
                    // then include the petition
                    petitions.push({
                        'id': o,
                        'title': users[o].title,
                        'content': users[o].content,
                        'time-range': users[o]["time-range"]
                    });
                }
            }
        },
        function(errorObject) {
            console.log("The read failed: " + errorObject.code);
        });
}


function initMap() {
    createMap();
    initDB();
    fetchMap();

    centerMap();
}

function centerMap() {
    map.setCenter(kaist);
}