// How many date is allowed before sending to 정보통신팀
var openDate = 1;
var maploaded = false;
var petitionloaded = false;
var petitionID;

function initPetition() {
    initDB();
    fetchPetiton();
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
    }

    if (inTimeline["receive"]) {
        receivedDate = new Date(inTimeline["receive"]);
        var tomorrow = new Date(+receivedDate);
        tomorrow.setMinutes(receivedDate.getMinutes() + 1);

        rows.push({ id: 'receive', content: "탄원서 제출/서명 모집 중", start: receivedDate, end: tomorrow, group: 'school', className: 'positive' });

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
        if (inEvent["item"] == "submit") {
            if (!maploaded) {
                maploaded = true;
                createMap();
                fetchMap();

                centerMap(center);
            }
            $("#petition").slideDown();
        }
    });


}

/* Fetch petitions. */
function fetchPetiton() {
    var playersRef = firebase.database().ref('petition/');
    // Attach an asynchronous callback to read the data at our posts reference
    playersRef.on("value", function(snapshot) {
            var users = snapshot.val();
            var petitions = [];



            var params = window.location.search.substring(1).split("&");
            for (var p in params) {
                if (params[p].split("=")[0] == "id")
                    petitionID = params[p].split("=")[1];
            }

            if (!users[petitionID]) {
                alert("존재하지 않은 탄원서입니다!")
                return;
            }

            // DEBUGGING purpose
            // petitionID = "GP9Qmglg";

            displayPetition({
                'title': users[petitionID].title,
                'content': users[petitionID].content,
                'time-range': users[petitionID]["time-range"]
            });


            center = {
                lat: users[petitionID].latitude,
                lng: users[petitionID].longitude
            };

            if (!petitionloaded) {
                petitionloaded = true;
                initTimeline(users[petitionID]["time-line"]);
            }



        },
        function(errorObject) {
            console.log("The read failed: " + errorObject.code);
        });
}

function displayPetition(inResponse) {
    $("#title").text(inResponse['title'] + " (case #: " + petitionID + ")");
    $('#content').text(inResponse['content']);
}

function centerMap(inCenter) {
    map.setCenter(inCenter);
}