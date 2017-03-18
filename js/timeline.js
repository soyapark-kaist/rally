// How many date is allowed before sending to 정보통신팀
var openDate = 1;
var maploaded = false,
    petitionloaded = false;
var petition, petitionID, hour_range;
var isReceiving = false,
    isAdmin = false;
var users;

function initPetition() {
    toggleLoading("#timeline");
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

        rows.push({ id: 'submit', content: "민원 제출/서명 모집 중", start: submitDate, end: tomorrow, group: 'presenter', className: 'positive' });

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
        toggleLoading(".loading");

        $("#petition").css("display", "none");
        $("#receive").css("display", "none");
        $("#respond").css("display", "none");

        if (inEvent["item"] == "submit") {
            if (!maploaded) {
                maploaded = true;
                createMap();
                fetchMap(null);

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

        toggleLoading(".loading");
    });

    toggleLoading("#timeline");
}

/* Fetch petitions. */
function fetchPetiton(inReceiving) {
    var playersRef = firebase.database().ref('petition/');
    // Attach an asynchronous callback to read the data at our posts reference
    playersRef.once("value").then(function(snapshot) {
        var users = snapshot.val();

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
    var pLat = center.lat,
        pLng = center.lng;

    if (!users) {
        var playersRef = firebase.database().ref('users/');
        // Attach an asynchronous callback to read the data at our posts reference
        playersRef.once("value").then(function(snapshot) {
                users = snapshot.val();

                filterSignature(hour_range, { "lat": pLat, "lng": pLng });

            },
            function(errorObject) {
                alert("The read failed: " + errorObject.code);
                // $btn.button('reset');
            });
    } //If END, when DB is not yet fetched
    else {
        filterSignature(hour_range, { "lat": pLat, "lng": pLng });
        //ttt();
        // $btn.button('reset');
    } //else END, when DB is already fetched
}

function checkEligibility() {
    var hour = new Date().getHours();
    if (!filterHour(hour_range, (hour_range + 3) % 24, hour)) {
        alert("민원 시간대에 해당하지 않습니다! " + hour_range + ":00 ~ " + (hour_range + 3) % 24 + ":00");
        return;
    }

    // Try HTML5 geolocation.
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(function(position) {
                current_loc = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                if ((Math.abs(current_loc.lat - petition["latitude"]) <= 0.00056) && (Math.abs(current_loc.lng - petition["longitude"]) <= 0.00056)) {
                    // then include the signature
                    localStorage.setItem("isSlow", petition["quorum"] == 5 ? true : false);
                    window.location.replace("./collect.html");

                } else alert("현재 민원 장소에 있지 않으십니다!");
            },
            function() { //error callback
                console.log("Error geolocation");
                alert('브라우저의 위치정보 수집이 불가합니다. 설정에서 승인 후 다시 시도해주세요.');
                // handleLocationError(true, infoWindow, map.getCenter());
            }, {
                timeout: 10000
            });


    } else {
        // Browser doesn't support Geolocation
        console.log("Error geolocation; brower doesn't support");
        alert('브라우저의 위치정보 수집이 불가합니다. 다른 브라우저에서 다시 시도해주세요.');
        // handleLocationError(false, infoWindow, map.getCenter());
    }
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