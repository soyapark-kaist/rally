var userID;
var pos;
var bldgs, bldgRate;
var bounds;

$(function() {
    toggleLoading("#loading");

    $('[data-toggle="tooltip"]').tooltip({
        html: true
    })
})

function initVis() {
    infoWindow = new google.maps.InfoWindow({ map: map });
    infoWindow.close();

    bounds = new google.maps.LatLngBounds();

    var openDateRef = firebase.database().ref('opendate/');
    openDateRef.once("value").then(function(snapshot) {
        openDate = new Date(snapshot.val());

        var bldgRef = firebase.database().ref("bldg/");
        // Attach an asynchronous callback to read the data at our posts reference
        bldgRef.once("value").then(function(snapshot) {
            bldgs = snapshot.val();

            var now = new Date();
            var dateRange = [];

            for (var d = openDate; d <= now; d.setDate(d.getDate() + 1)) {
                dateRange.push([d.getFullYear(), d.getMonth() + 1, d.getDate()].join("-"));
            }

            bldgRate = new Array(Object.keys(bldgs).length + 1).join('0').split('').map(parseFloat); // [0,0 ..]

            markBldg(0, dateRange);

        });

    });



    // var victoryRef = firebase.database().ref("victory/");
    // // Attach an asynchronous callback to read the data at our posts reference
    // victoryRef.once("value").then(function(snapshot) {
    //     var vic = snapshot.val();

    //     for (var v in vic) {
    //         $('.table-victory tbody').append(
    //             '<tr onclick="window.document.location=\'./timeline.html?id=' + v + '\';">\
    //                 <td>' + vic[v].name + '</td>\
    //                 <td>' + vic[v].cnt + ' 명' + '</td>\
    //                 <td>' + (vic[v].received ? "정보통신팀에서 답변 도착" : "답변 대기 중") + '</td>\
    //             </tr>');
    //     }
    // })

}

function markBldg(inDateIndex, inDateRange) {
    if (inDateIndex == inDateRange.length) {
        var tableRows = [];

        for (var p in bldgs) {
            p = parseInt(p);

            tableRows.push({ "url": bldgs[p].url, "name": bldgs[p].name, "rate": bldgRate[p] });

            // Add the circle for the petition to the map.
            var marker = createMarker(bldgs[p].url, { lat: bldgs[p].lat, lng: bldgs[p].lng }, bldgs[p].name, bldgRate[p]);
            bounds.extend({ lat: bldgs[p].lat, lng: bldgs[p].lng });


            marker.addListener('click', function(e) {
                infoWindow.open(map);
                infoWindow.setContent(this.title + " (" + this.rate + "명) <a class='btn btn-primary' href='./timeline.html?id=" + this.petitionID + "'>자세히 보기</a>");
                infoWindow.setPosition(this.getPosition())
            });
        }

        tableRows = tableRows.sort(function(a, b) { return (a.rate < b.rate) ? 1 : ((b.rate < a.rate) ? -1 : 0); });

        for (var i = 0; i < 5; i++) {
            $('.table-inbox tbody').append(
                '<tr onclick="window.document.location=\'./timeline.html?id=' + tableRows[i].url + '\';">\
                            <td>' + "#" + (i + 1) + " " + tableRows[i].name + ' (' + tableRows[i].rate + '명)' + '</td>\
                            </tr>'
            );
        }

        map.fitBounds(bounds);

        toggleLoading("#loading");

        return;
    }

    var playersRef = firebase.database().ref('users/' + inDateRange[inDateIndex]);
    // Attach an asynchronous callback to read the data at our posts reference
    playersRef.once("value").then(function(snapshot) {
            users = snapshot.val();

            for (var o in users) {
                bldgRate[parseInt(users[o].bldg)]++;
            }

            markBldg(++inDateIndex, inDateRange);
        },
        function(errorObject) {
            alert("The read failed: " + errorObject.code);
            // $btn.button('reset');
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
    markMap(); // show today report

    initVis();
}

function centerMap() {
    map.setCenter(kaist);
}