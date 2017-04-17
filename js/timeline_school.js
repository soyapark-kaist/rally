var petitionID;
$(function() {
    $('[data-toggle="tooltip"]').tooltip({
        html: true
    })
    $(".opened-case").hide();

    var params = window.location.search.substring(1).split("&");
    var isSharing = false;
    for (var p in params) {
        if (params[p].split("=")[0] == "id")
            petitionID = params[p].split("=")[1];

        if (params[p].split("=")[0] == "r3v") {
            // Add timestamp
            var playersRef = firebase.database().ref('campaign/' + petitionID);
            // Attach an asynchronous callback to read the data at our posts reference
            playersRef.update({
                "received": new Date().toString()
            }, function(error) {
                if (error) {
                    console.log(error);
                } else {
                    debugger;
                    // when post to DB is successful
                    window.location.replace("./timeline_school.html?adn=true");
                }
            });
        }

        if (params[p].split("=")[0] == "adn") {
            isAdmin = true; //the user is admin.
        }
    }

    var campaign = firebase.database().ref('campaign/');
    campaign.once("value").then(function(snapshot) {
        var BLDG_index = snapshot.val()[petitionID].bldg;
        var openDateRef = firebase.database().ref('opendate/');
        openDateRef.once("value").then(function(snapshot) {
            var now = new Date();
            var dateRange = [];

            var inTargetDate = new Date(snapshot.val());

            // console.log([d.getFullYear(), d.getMonth() + 1, d.getDate()].join("-"));

            var usersRef = firebase.database().ref('users/');
            usersRef.once("value").then(function(snapshot) {
                var users = snapshot.val();

                for (var d = inTargetDate; d <= now; d.setDate(d.getDate() + 1)) {
                    var day = [d.getFullYear(), d.getMonth() + 1, d.getDate()].join("-");

                    for (var u in users[day]) {
                        if (users[day][u].bldg == BLDG_index)
                            if (u.indexOf("conn") != -1)
                                appendConnRow(users[day][u].email, users[day][u].time, users[day][u].room, users[day][u].ip_addr, users[day][u].os, users[day][u].web, users[day][u].type, users[day][u]["welcome_kaist"], users[day][u]["wi-fi"]);
                            else
                                appendSpeedRow(users[day][u].email, users[day][u].time, users[day][u].ip_addr, users[day][u].os, users[day][u].web, users[day][u].type, users[day][u].download + "/" + users[day][u].upload, users[day][u].activity, users[day][u].speed, users[day][u].consistency);
                    }
                }

            });

            // toggleLoading(".loading");
        });
    });



})

function appendSpeedRow(inEmail, inDate, inIP, inOS, inWeb, inType, inBandwidth, inActivity, inSpeed, inConsistency) {
    if (inType == 0) inType = "welcome_kaist";
    else if (inType == 1) inType = "그외 공유기";
    else inType = "랜선";

    if (inSpeed == 0) inSpeed = "즉각적이다";
    else if (inSpeed == 1) inSpeed = "지연을 느낌";
    else if (inSpeed == 2) inSpeed = "원하는만큼 못 사용";
    else if (inSpeed == 3) inSpeed = "응답없음";

    if (inConsistency == 1) inConsistency = "일정함";
    else if (inConsistency == 2) inConsistency = "쓸만함";
    else if (inConsistency == 3) inConsistency = "불안정";


    if (inEmail == undefined) inEmail = "***";
    inDate = inDate.split("GMT+09")[0];

    $('.detailed-data-speed tbody').append(
        '<tr>\
            <td>' + inType + '</td>\
            <td>' + inEmail + '</td>\
            <td>' + inDate + '</td>\
            <td>' + inIP + '</td>\
            <td>' + inOS + '</td>\
            <td>' + inWeb + '</td>\
            <td>' + inBandwidth + '</td>\
            <td>' + inActivity + '</td>\
            <td>' + inSpeed + '</td>\
            <td>' + inConsistency + '</td>\
          </tr>'
    );
}

/*
<th>이메일</th>
<th>제출 일시</th>
<th>건물에서의 위치</th>
<th>IP</th>         
<th>OS</th>
<th>web</th>
<th>사용 중이던 인터넷 유형</th>
<th>welcome_kaist의 신호세기(안테나 갯수)</th>
 */

function appendConnRow(inEmail, inDate, inLoc, inIP, inOS, inWeb, inType, inStrength, inOtherAP) {
    if (inType == 0) inType = "welcome_kaist";
    else if (inType == 1) inType = "그외 공유기";
    else inType = "랜선";
    if (inEmail == undefined) inEmail = "***";
    inDate = inDate.split("GMT+09")[0];

    $('.detailed-data tbody').append(
        '<tr>\
            <td>' + inType + '</td>\
            <td>' + inEmail + '</td>\
            <td>' + inDate + '</td>\
            <td>' + inLoc + '</td>\
            <td>' + inIP + '</td>\
            <td>' + inOS + '</td>\
            <td>' + inWeb + '</td>\
            <td>' + inStrength + "%" + '</td>\
            <td>' + inOtherAP + '</td>\
          </tr>'
    );
}