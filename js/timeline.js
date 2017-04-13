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
            var email = firebase.auth().currentUser.email ? firebase.auth().currentUser.email.substring(0, 3) : "***";
            $(".comments li").each(function(index) {
                if (email == "***") return;
                if ($(this).text().indexOf(email)) {
                    cnt++;
                }

            });

            if (cnt > 1) {
                alert("단시간에 많은 댓글을 입력하실 수 없습니다. 다음에 다시 입력해주세요");
                return;
            }


            $('.comments').prepend('<li><i class="fa fa-user" aria-hidden="true"></i> ' + email + "** : " + post + '</li>');
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
    var isSharing = false;
    for (var p in params) {
        if (params[p].split("=")[0] == "id")
            petitionID = params[p].split("=")[1];

        if (params[p].split("=")[0] == "r3v") {
            isReceiving = true;
        }

        if (params[p].split("=")[0] == "adn") {
            isAdmin = true; //the user is admin.
        }

        if (params[p].split("=")[0] == "sharing" && params[p].split("=")[1] == "true") {
            // Show description. 
            isSharing = true;

        }
    }

    if (localStorage.getItem("participate") == "1") {
        localStorage.setItem("participate", "0")
        $(".participate-row").toggle();
    }

    if (!isSharing) {
        $("#sharing-intro").hide();
    }
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

        if (p.respond) {
            fill_progress_circle(3);
            $("#current-progress").text("정보통신팀 답변 도착");

            displayRespond(p.respond);
        } else if (p.sent) { // If it's sent to school
            fill_progress_circle(2);
            $("#current-progress").text("정보통신팀에 전송");

            $('.opened-case').toggle();
        } else {
            fill_progress_circle(1);
        }

        if (p.content) displayPetition(p.content);
        if (p.comments) displayComments(p.comments);


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
        var email = inComment[c].email ? inComment[c].email.substring(0, 3) : "***";
        if (inComment[c].accepted) {
            $("#accepted-comments").prepend('<div class="alert alert-success" role="alert"><strong><i class="fa fa-check-square-o" aria-hidden="true"></i></strong>' + email + "** : " + inComment[c].content + '</div>');
        } else {
            if (cnt++ == 3) continue; // show upto three comments
            $('.comments').prepend('<li><i class="fa fa-user" aria-hidden="true"></i> ' + email + "** : " + inComment[c].content + ' (' + (new Date(c)) + ')</li>');
        }


    }
}

function displayRespond(inResponse) {
    $('#respond span').text(inResponse);
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
                "email": user.email ? user.email : "******",
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

/*
@cid id of chart to append legend
@legendEmt Array of Object {name, color}
    e.g.
    legendEmt = [
        { name: "진행중인 캠페인", color: "#fff" },
        { name: "작동 안함", color: "#ccc" },
    ]
*/
function displayLegend(selector, legendEmt) {
    // var chart = document.getElementById(cid);
    var chart = $(selector);
    // var legend = document.createElement('div');
    var legend = $('<div></div>');
    for (var le in legendEmt) {
        var name = legendEmt[le].name;
        var color = legendEmt[le].color;
        var div = $('<div></div>');
        div.append('<i class="fa fa-circle" aria-hidden="true" style=color:' +
            color + '></i>&nbsp' + name);
        legend.append(div);
    }
    chart.append(legend);
}