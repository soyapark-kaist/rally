$(function() {
    $(".opened-case").hide();

    var params = window.location.search.substring(1).split("&");
    var isSharing = false;
    for (var p in params) {
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

    var openDateRef = firebase.database().ref('opendate/');
    openDateRef.once("value").then(function(snapshot) {
        var now = new Date();
        var dateRange = [];

        for (var d = inTargetDate; d <= now; d.setDate(d.getDate() + 1)) {
            // console.log([d.getFullYear(), d.getMonth() + 1, d.getDate()].join("-"));
            dateRange.push([d.getFullYear(), d.getMonth() + 1, d.getDate()].join("-"));
        }

        fetchSignature(0, dateRange, inBldgIdx, inQuorum);

        toggleLoading(".loading");
    });

})

function appendSpeedRow(inID, inTitle, inDate, inProgress) {
    $('.detailed-data tbody').append(
        '<tr>\
            <td>' + inTitle + '</td>\
            <td>' + inDate + '</td>\
            <td>' + inProgress + '</td>\
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

function appendConnRow(inEmail, inDate, inLoc, inIP, inOS, inWeb, inType, inStrength) {
    $('.detailed-data tbody').append(
        '<tr>\
            <td>' + inType + '</td>\
            <td>' + inEmail + '</td>\
            <td>' + inDate + '</td>\
            <td>' + inLoc + '</td>\
            <td>' + inIP + '</td>\
            <td>' + inOS + '</td>\
            <td>' + inWeb + '</td>\
            <td>' + inStrength + '</td>\
          </tr>'
    );
}