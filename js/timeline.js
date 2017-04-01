var openDate = 1; // How many date is allowed before sending to 정보통신팀
var maploaded = false,
    petitionloaded = false;
var petition, petitionID, hour_range;
var isReceiving = false,
    isAdmin = false;
var users;

var BLDG_INDEX;

$(function() {
    toggleLoading(".loading");
    initDB();

    initParams();

    fetchPetiton();

    // comment event handler
    $('.comments-post').click(function() {
        var cnt = 0;
        var post = $('.status-box').val();

        if (firebase.auth().currentUser) {
            $(".comments li").each(function(index) {
                if ($(this).text().indexOf(firebase.auth().currentUser.email.substring(0, 4))) {
                    cnt++;
                }

            });

            if (cnt > 1) {
                alert("단시간에 많은 댓글을 입력하실 수 없습니다. 다음에 다시 입력해주세요");
                return;
            }


            $('.comments').prepend('<li><i class="fa fa-user" aria-hidden="true"></i> ' + firebase.auth().currentUser.email.substring(0, 4) + "** : " + post + '</li>');
            $('.status-box').val('');
            $('.counter').text('140');
            $('.comments-post').addClass('disabled');
        }

        postComment(post);
    });

    $('.status-box').keyup(function() {
        var postLength = $(this).val().length;
        var charactersLeft = 140 - postLength;
        $('.counter').text(charactersLeft);

        if (charactersLeft < 0) {
            $('.comments-post').addClass('disabled');
        } else if (charactersLeft == 140) {
            $('.comments-post').addClass('disabled');
        } else {
            $('.comments-post').removeClass('disabled');
        }
    });
})

function initParams() {
    var params = window.location.search.substring(1).split("&");
    for (var p in params) {
        if (params[p].split("=")[0] == "id")
            petitionID = params[p].split("=")[1];

        if (params[p].split("=")[0] == "r3v") {
            isReceiving = true;
        }

        if (params[p].split("=")[0] == "adn") {
            isAdmin = true; //the user is admin. 
        }
    }

    if (localStorage.getItem("participate") == "1") {
        localStorage.setItem("participate", "0")
        $(".participate-row").toggle();
    }
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
        // toggleLoading(".loading");

        $("#petition").css("display", "none");
        $("#receive").css("display", "none");
        $("#respond").css("display", "none");

        if (inEvent["item"] == "submit") {
            if (!maploaded) {
                maploaded = true;
                // createMap();
                // markMap(null);

                // centerMap(center);
                // createCircle(petitionID, { "lat": petition["latitude"], "lng": petition["longitude"] }, petition["title"]);

                selectSignature();
            }

            $("#petition").slideDown();

        } else if (inEvent["item"] == "receive") {
            $("#receive").slideDown();
        } else if (inEvent["item"] == "respond") {
            $("#respond").slideDown();
        } else {

        }

        // toggleLoading(".loading");
    });

    toggleLoading(".loading");
}

/* Fetch petitions. */
function fetchPetiton(inReceiving) {
    var playersRef = firebase.database().ref('campaign/' + petitionID);
    // Attach an asynchronous callback to read the data at our posts reference
    playersRef.once("value").then(function(snapshot) {
        var p = snapshot.val();
        if (!p) {
            alert("존재하지 않은 캠페인입니다!")
            return;
        }

        BLDG_INDEX = parseInt(p.bldg);

        fill_progress_circle(1);
        $("#current-progress").text("인터넷 캠페인 진행 중");
        if (p.content) displayPetition(p.content);
        if (p.comments) displayComments(p.comments);
        if (p.sent) { // If it's sent to school
            // $('opened-case').toggle();
        }

        var bldgRef = firebase.database().ref('bldg/' + p.bldg);
        bldgRef.once("value").then(function(snapshot) {
            var b = snapshot.val();
            // Building name
            $("#bldgName").text(b.name);

            // signature & progress bar 
            selectSignature(BLDG_INDEX, b.headcnt ? b.headcnt : 100);
        });
    });
}

function displayPetition(inContent) {
    $('#content').text(inContent);
}

function displayComments(inComment) {
    var cnt = 0;
    for (var c in inComment) {

        $('.comments').prepend('<li><i class="fa fa-user" aria-hidden="true"></i> ' + inComment[c].email.substring(0, 4) + "** : " + inComment[c].content + ' (' + (new Date(c)) + ')</li>');
        if (++cnt == 3) return;
    }
}

function displayRespond(inResponse) {
    $('#respond p').text(inResponse);
}

function displayAvailablePetition(inPetitions) {
    if (inPetitions.length == 0) {
        $(".table-inbox").css("display", "none");
        $("#inavailable").css("display", "block");
    } else {
        for (var o in inPetitions) {
            appendRow(inPetitions[o].id, inPetitions[o].title, inPetitions[o]["time-line"]["submit"].split(" GMT")[0], MSG_PROGRESS[getProgress(inPetitions[o]["time-line"])]);
        }
    }

    $("#participate").button('reset');
    $('#available-modal').modal('show');
}

function centerMap(inCenter) {
    map.setCenter(inCenter);
}

function selectSignature(pBldgIdx, pHeadCount) {
    var openDateRef = firebase.database().ref('opendate/');
    openDateRef.once("value").then(function(snapshot) {
        filterSignature(new Date(snapshot.val()), pBldgIdx, pHeadCount);
        toggleLoading(".loading");
    });
}

function checkEligibility() {
    var $btn = $("#participate").button('loading');

    var isEligible = true;
    var hour = new Date().getHours();
    var hour_from = TIME_RANGE[parseInt(petition["time-range"])].from,
        hour_to = TIME_RANGE[parseInt(petition["time-range"])].to;
    if (!filterHour(hour_range, hour_to, hour)) {
        //alert("민원 시간대에 해당하지 않습니다! " + hour_range + ":00 ~ " + (hour_range + 3) + ":00");
        isEligible = false;
    }

    // Try HTML5 geolocation.
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(function(position) {
                current_loc = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                //debugging purpose
                // current_loc = {
                //     lat: petition["latitude"],
                //     lng: petition["longitude"]
                // };

                if (isEligible && (Math.abs(current_loc.lat - petition["latitude"]) <= 0.0009) && (Math.abs(current_loc.lng - petition["longitude"]) <= 0.0009)) {
                    window.location.replace("./collect.html");

                } else {
                    isEligible = false;
                }

                //recommend other petition
                if (!isEligible) {
                    filterPetiton(hour, current_loc, displayAvailablePetition);
                }

            },
            function() { //error callback
                console.log("Error geolocation");
                alert('브라우저의 위치정보 수집이 불가합니다. 설정에서 승인 후 다시 시도해주세요.');
                $("#participate").button('reset')
                    // handleLocationError(true, infoWindow, map.getCenter());
            }, {
                timeout: 10000
            });


    } else {
        // Browser doesn't support Geolocation
        console.log("Error geolocation; brower doesn't support");
        alert('브라우저의 위치정보 수집이 불가합니다. 다른 브라우저에서 다시 시도해주세요.');
        $("#participate").button('reset')
            // handleLocationError(false, infoWindow, map.getCenter());
    }
}

function postComment(inPost) {
    // Check whether the user is authenticated
    var user = firebase.auth().currentUser;

    // User is signed in.
    if (user) {
        var now = new Date().toISOString().split(".")[0];

        var pRef = firebase.database().ref("campaign/" + petitionID + "/comments/" + now);

        pRef.set({
                "email": user.email,
                "content": inPost
            },
            function(error) {
                if (error) {
                    console.log(error);
                } else {
                    // when post to DB is successful
                }
            });
    } else {
        localStorage.setItem("code", "2");
        localStorage.setItem("comment", inPost);
        localStorage.setItem("petitionID", petitionID);
        localStorage.setItem("callback", window.location.href);

        window.location.replace("./login.html");
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

function filterPetiton(inHour, inLoc, inCallback) {
    var playersRef = firebase.database().ref('petition/');
    // Attach an asynchronous callback to read the data at our posts reference
    playersRef.once("value").then(function(snapshot) {
        var petitions = snapshot.val();
        var p = [];

        for (var o in petitions) {
            var hour = inHour;
            var hour_from = TIME_RANGE[parseInt(petitions[o]["time-range"])].from,
                hour_to = TIME_RANGE[parseInt(petitions[o]["time-range"])].to;
            if (!filterHour(hour_from, hour_to, hour)) {
                continue;
            }

            var lat = petitions[o].latitude,
                lng = petitions[o].longitude;


            // if (true) {
            if ((Math.abs(inLoc.lat - lat) <= 0.0009) && (Math.abs(inLoc.lng - lng) <= 0.0009)) {
                // then include the petition
                p.push({
                    'id': o,
                    'title': petitions[o].title,
                    'content': petitions[o].content,
                    'time-range': petitions[o]["time-range"],
                    'time-line': petitions[o]["time-line"]
                });
            }
        }

        inCallback(p);
    });
}