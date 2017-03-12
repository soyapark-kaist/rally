// How many date is allowed before sending to 정보통신팀
var openDate = 1;
var maploaded = false,
    petitionloaded = false;
var petition, petitionID, hour_range;
var isReceiving = false,
    isAdmin = false;

function initPetition() {
    initDB();

    var params = window.location.search.substring(1).split("&");
    for (var p in params) {
        if (params[p].split("=")[0] == "id")
            petitionID = params[p].split("=")[1];

        if (params[p].split("=")[0] == "r3v") {
            isReceiving = true;
        }

        if (params[p].split("=")[0] == "adn") {
            isAdmin = true; //the user is admin. 
            $("#adminOnly").css("display", "block");
        }

    }

    fetchPetiton(isReceiving);
    // initTimeline();
}

function initTimeline(inTimeline) {
    // create a dataset with items
    // we specify the type of the fields `start` and `end` here to be strings
    // containing an ISO date. The fields will be outputted as ISO dates
    // automatically getting data from the DataSet via items.get().
    var items = new vis.DataSet({
        type: { start: 'ISODate', end: 'ISODate' }
    });
    var groups = new vis.DataSet([{
        id: 'presenter',
        content: '청원인'
    }, {
        id: 'school',
        content: '정보통신팀',
        subgroupOrder: 'subgroupOrder' // this group has no subgroups but this would be the other method to do the sorting.
    }]);

    // add items to the DataSet
    var rows = [];
    var cnt = 0;
    var submitDate, receivedDate;
    var options;

    // rows.push({ id: 'A', start: new Date(), end: new Date(), group: 'now' })

    if (inTimeline["submit"]) {
        submitDate = new Date(inTimeline["submit"]);
        var tomorrow = new Date(+submitDate);
        tomorrow.setDate(submitDate.getDate() + openDate);

        rows.push({ id: 'submit', content: "탄원서 제출/서명 모집 중", start: submitDate, end: tomorrow, group: 'presenter', className: 'positive' });

        cnt += 1;
    }

    if (inTimeline["receive"]) {
        receivedDate = new Date(inTimeline["receive"]);

        var tomorrow = new Date(+receivedDate);
        tomorrow.setMinutes(receivedDate.getMinutes() + 120);
        receivedDate.setMinutes(receivedDate.getMinutes() - 120);

        rows.push({ id: 'receive', content: "수신", start: receivedDate, end: tomorrow, group: 'school', className: 'negative' });

        cnt += 1;
    }

    if (inTimeline["respond"]) {
        $("#adminOnly").css("display", "none");
        receivedDate = new Date(inTimeline["respond"]);

        var tomorrow = new Date(+receivedDate);
        tomorrow.setMinutes(receivedDate.getMinutes() + 120);
        receivedDate.setMinutes(receivedDate.getMinutes() - 120);

        rows.push({ id: 'respond', content: "답변", start: receivedDate, end: tomorrow, group: 'school', className: 'negative' });

        cnt += 1;
    }

    // When the petition is only submitted.  
    if (cnt <= 1) {
        var maxDay = new Date(+submitDate);
        maxDay.setDate(submitDate.getDate() + 3);
        options = {
            end: maxDay
        };

        cnt += 1;
    }

    items.add(rows);

    var container = document.getElementById('timeline');
    // var options = {
    //     // orientation:'top'
    //     editable: true,
    //     stack: false,
    //     stackSubgroups: true
    // };

    var timeline = new vis.Timeline(container, items, groups, options);

    timeline.on('click', function(inEvent) {
        $("#petition").css("display", "none");
        $("#receive").css("display", "none");
        $("#respond").css("display", "none");

        if (inEvent["item"] == "submit") {
            if (!maploaded) {
                maploaded = true;
                createMap();
                fetchMap();

                centerMap(center);
                selectSignature();
            }

            $("#petition").slideDown();

        } else if (inEvent["item"] == "receive") {
            $("#receive").slideDown();
        } else if (inEvent["item"] == "respond") {
            $("#respond").slideDown();
        } else {

        }
    });


}

/* Fetch petitions. */
function fetchPetiton(inReceiving) {
    var playersRef = firebase.database().ref('petition/');
    // Attach an asynchronous callback to read the data at our posts reference
    playersRef.on("value", function(snapshot) {
            var users = snapshot.val();
            var petitions = [];

            if (!users[petitionID]) {
                alert("존재하지 않은 탄원서입니다!")
                return;
            }

            // if receive is not yet operated, then update the time-line.
            if (inReceiving && !users[petitionID]["time-line"]["receive"]) {
                var pRef = firebase.database().ref("petition/" + petitionID);
                pRef.update({
                    "time-line": {
                        "submit": users[petitionID]["time-line"]["submit"],
                        "receive": new Date().toString()
                    }
                }, function(error) {
                    if (error) {
                        console.log(error);
                    } else {

                        // when post to DB is successful 
                        routeToTimeline(petitionID, isAdmin);
                    }
                });
            } else
                storePetitionInfo(users[petitionID]);

        },
        function(errorObject) {
            console.log("The read failed: " + errorObject.code);
        });
}

function storePetitionInfo(inPetition) {
    petition = inPetition;

    displayPetition({
        'title': inPetition.title,
        'content': inPetition.content,
        'time-range': inPetition["time-range"]
    });

    if (inPetition["time-line"]["respond"])
        displayRespond(inPetition["time-line"]["respond-msg"]);


    center = {
        lat: inPetition.latitude,
        lng: inPetition.longitude
    };
    hour_range = parseInt(inPetition["time-range"].split(":")[0]);

    if (!petitionloaded) {
        petitionloaded = true;
        initTimeline(inPetition["time-line"]);
    }
}

function displayPetition(inResponse) {
    $("#title").text(inResponse['title'] + " (case #: " + petitionID + ")");
    $('#content').text(inResponse['content']);
}

function displayRespond(inResponse) {
    $('#respond p').text(inResponse);
}

function centerMap(inCenter) {
    map.setCenter(inCenter);
}

function selectSignature() {
    var playersRef = firebase.database().ref('users/');
    // Attach an asynchronous callback to read the data at our posts reference
    playersRef.on("value", function(snapshot) {
            var users = snapshot.val();
            var datas = {},
                download = [],
                upload = [];

            var pLat = center.lat,
                pLng = center.lng;

            for (var o in users) {
                for (var u in users[o]) {
                    var hour = new Date(users[o][u].time);
                    hour = hour.getHours();

                    if (!(hour_range <= hour && hour < hour_range + 3)) {
                        continue;
                    }

                    var lat = users[o][u].latitude,
                        lng = users[o][u].longitude;

                    if ((Math.abs(pLat - lat) <= 0.0016) && (Math.abs(pLng - lng) <= 0.0016)) {
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
        },
        function(errorObject) {
            alert("The read failed: " + errorObject.code);
        });
}

function postRespond() {
    var pRef = firebase.database().ref("petition/" + petitionID);
    pRef.update({
        "time-line": {
            "submit": petition["time-line"]["submit"],
            "receive": petition["time-line"]["receive"],
            "respond": new Date().toString(),
            "respond-msg": $('#compose-message').val()
        }
    }, function(error) {
        if (error) {
            console.log(error);
        } else {
            // when post to DB is successful
            window.location.replace(window.location.href);
        }
    });

    return false;
}