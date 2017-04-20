var openDate = 1; // How many date is allowed before sending to 정보통신팀
var maploaded = false,
    petitionloaded = false;
var petition, petitionID, hour_range;
var isReceiving = false,
    isAdmin = false,
    weekNumber = false;
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
        var post = $(this).parent().parent().find(".status-box").val();

        if (firebase.auth().currentUser) {
            var email = firebase.auth().currentUser.email ? firebase.auth().currentUser.email.substring(0, 3) : "***";
            $(this).parent().parent().find(".comments li").each(function(index) {
                if (email == "***") return;
                if ($(this).text().indexOf(email)) {
                    cnt++;
                }

            });

            if (cnt > 1) {
                alert("단시간에 많은 댓글을 입력하실 수 없습니다. 다음에 다시 입력해주세요");
                return;
            }


            $(this).parent().parent().find(".comments").prepend('<li><i class="fa fa-user" aria-hidden="true"></i> ' + email + "** : " + post + '</li>');
            $(this).parent().parent().find(".status-box").val('');
            $(this).parent().parent().find(".counter").text('140');
            $(this).parent().parent().find(".comments-post").addClass('disabled');
        }
        postComment(post, $(this).parent().find(".like-comment").length != 0);
    });

    $('.status-box').keyup(function() {
        var postLength = $(this).val().length;
        var charactersLeft = 140 - postLength;
        $(this).parent().parent().parent().find(".counter").text(charactersLeft);

        if (charactersLeft < 0) {
            $(this).parent().parent().parent().find(".comments-post").addClass('disabled');
        } else if (charactersLeft == 140) {
            $(this).parent().parent().parent().find(".comments-post").addClass('disabled');
        } else {
            $(this).parent().parent().parent().find(".comments-post").removeClass('disabled');
        }
    });
})

function initParams() {
    var params = window.location.search.substring(1).split("&");
    var isSharing = false;
    for (var p in params) {
        if (params[p].split("=")[0] == "id")
            petitionID = params[p].split("=")[1];

        if (params[p].split("=")[0] == "date")
            weekNumber = parseInt(params[p].split("=")[1]);

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

    if (weekNumber) {

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

        // Handling comments
        if (weekNumber === 0) {
            if (p.comments) attachComments(p);
        }

        fetchContents();

        var bldgRef = firebase.database().ref('bldg/' + p.bldg);
        bldgRef.once("value").then(function(snapshot) {
            var b = snapshot.val();

            if (b) {
                // Building name
                $("#bldgName").text(b.name);

                // signature & progress bar
                getDateRangebyWeek(getSignature, BLDG_INDEX, p.culmutative ? p.culmutative : 0);
                // getSignature(BLDG_INDEX, weekNumber, p.culmutative ? p.culmutative : 0);
            } else {
                $("#bldgName").text("테스트");

                toggleLoading(".loading");
            }


        });
    });
}

function fetchContents() {
    var campaign_contentRef = firebase.database().ref(['campaign-content', petitionID, weekNumber === false ? getCurrentWeek() : weekNumber, ""].join("/"));
    campaign_contentRef.once("value").then(function(snapshot) {
        getDateRangebyWeek(displayContents, snapshot.val());
    });

}

function displayContents(inStart, inEnd, inContent) {
    /* Progress */
    if (inContent && inContent.respond) {
        fill_progress_circle(3);
        $("#current-progress").text("정보통신팀 답변 도착");

        displayRespond(inContent.respond);
    } else if (inContent && inContent.sent) { // If it's sent to school
        fill_progress_circle(2);
        $("#current-progress").text("정보통신팀에 전송");

        $('.opened-case').hide();
    } else {
        fill_progress_circle(1);
    }

    /* Comments */
    attachComments(inContent);

    /* Feedback */
    attachFeedback(inContent);
}

function attachComments(inComment) {
    var cnt = 0;
    for (var c in inComment.comments) {
        var email = inComment.comments[c].email ? inComment.comments[c].email.substring(0, 3) : "***";
        if (inComment.comments[c].accepted) {
            $('#content').text("");
            $("#accepted-comments").prepend('<div class="alert alert-success" role="alert"><strong><i class="fa fa-check-square-o" aria-hidden="true"></i></strong>' + email + "** : " + inComment.comments[c].content + '</div>');
        } else {
            if (cnt++ == 3) continue; // show upto three comments
            $('.claim .comments').prepend('<li><i class="fa fa-user" aria-hidden="true"></i> ' + email + "** : " + inComment.comments[c].content + ' (' + (new Date(c)) + ')</li>');
        }
    }
}

function attachFeedback(inComment) {
    var cnt = 0;
    for (var c in inComment.feedback) {
        var email = inComment.feedback[c].email ? inComment.feedback[c].email.substring(0, 3) : "***";
        if (inComment.feedback[c].accepted) {
            $('#content').text("");
            $("#accepted-comments").prepend('<div class="alert alert-success" role="alert"><strong><i class="fa fa-check-square-o" aria-hidden="true"></i></strong>' + email + "** : " + inComment.feedback[c].content + '</div>');
        } else {
            if (cnt++ == 3) continue; // show upto three comments
            $('#like .comments').prepend('<li><i class="fa fa-user" aria-hidden="true"></i> ' + email + "** : " + inComment.feedback[c].content + ' (' + (new Date(c)) + ')</li>');
        }
    }
}

function displayRespond(inResponse) {
    $('#respond .respond-text').text(inResponse);
    $('#respond').show();
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

function getCurrentWeek() {
    var now = new Date();
    if (now > new Date("Wed Apr 05 2017 0:0:1 GMT+0900 (KST)") && now < new Date("Mon Apr 17 2017 23:59:21 GMT+0900 (KST)"))
        return 0;
    else {
        var targetDate = new Date("Tue Apr 11 2017 23:59:00 GMT+0900 (KST)");
        var timeDiff = Math.abs(new Date().getTime() - targetDate.getTime());
        var diffWeek = Math.floor(Math.ceil(timeDiff / (1000 * 3600 * 24)) / 7);
        return diffWeek;
    }
}

function getDateRangebyWeek(inCallback, inArg1, inArg2) {
    var d = {
        "start": "",
        "end": ""
    };

    if (weekNumber === 0) {
        d.start = new Date("Wed Apr 05 2017 0:0:1 GMT+0900 (KST)");
        d.end = new Date("Mon Apr 17 2017 23:59:21 GMT+0900 (KST)");

        inCallback(d.start, d.end, inArg1, inArg2);

    } else if (weekNumber > 0) {
        var startDate = new Date("Tue Apr 18 2017 0:0:1 GMT+0900 (KST)");
        startDate.setDate(startDate.getDate() + (weekNumber - 1) * 7);

        var endDate = new Date("Mon Apr 24 2017 23:59:1 GMT+0900 (KST)");
        endDate.setDate(endDate.getDate() + (weekNumber - 1) * 7);

        d.start = startDate;
        d.end = endDate;
        inCallback(d.start, d.end, inArg1, inArg2);
    } else {
        var openDateRef = firebase.database().ref('opendate/');
        openDateRef.once("value").then(function(snapshot) {
            inCallback(new Date(snapshot.val()), null, inArg1, inArg2);
        });

    } // ELSE END: no week number given(current week)

}

// caller function to filter signature
function getSignature(inStart, inEnd, inBldgIdx, inCulmutative) {
    filterSignature(inStart, inBldgIdx, inEnd, inCulmutative);
    // if (inWeek === 0)
    //     filterSignature(new Date("Wed Apr 05 2017 0:0:1 GMT+0900 (KST)"), inBldgIdx, new Date("Mon Apr 17 2017 23:59:21 GMT+0900 (KST)"), inCulmutative);

    // else if (inWeek > 0) {
    //     var startDate = new Date("Tue Apr 18 2017 0:0:1 GMT+0900 (KST)");
    //     startDate.setDate(startDate.getDate() + (inWeek - 1) * 7);

    //     var endDate = new Date("Mon Apr 24 2017 23:59:1 GMT+0900 (KST)");
    //     endDate.setDate(endDate.getDate() + (inWeek - 1) * 7);
    //     console.log(startDate, endDate, inWeek);
    //     filterSignature(startDate, inBldgIdx, endDate, inCulmutative); // TODO pass given week
    // } else {
    //     var openDateRef = firebase.database().ref('opendate/');
    //     openDateRef.once("value").then(function(snapshot) {
    //         filterSignature(new Date(snapshot.val()), inBldgIdx, inWeek, inCulmutative);

    //     });
    // }
}

function postComment(inPost, isLike) {
    // Check whether the user is authenticated
    var user = firebase.auth().currentUser;

    // User is signed in.
    if (user) {
        var now = new Date().toISOString().split(".")[0];

        var pRef = firebase.database().ref(["campaign-content", petitionID, weekNumber === false ? getCurrentWeek() : weekNumber, isLike ? "feedback" : "comments", now].join("/"));

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
        firebase.auth().signInAnonymously().then(function(user) {
            var now = new Date().toISOString().split(".")[0];

            var pRef = firebase.database().ref(["campaign-content", petitionID, weekNumber === false ? getCurrentWeek() : weekNumber, isLike ? "feedback" : "comments", now].join("/"));

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
        });
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