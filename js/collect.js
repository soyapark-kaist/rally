var isSlow = localStorage.getItem("isSlow");

function initListener() {
    /* INTERNET */
    /* Scroll to activity section */
    $("#speedo-start").click(function() {
        document.documentElement.addEventListener('DOMAttrModified', function(e) {
            if (e.attrName === 'style' && e.target.id == "ready" && e.newValue == "display: block;") {
                console.log("Test over. Download: " + $(".data.download").text() + ". Upload: " + $(".data.upload").text())

                $("html, body").animate({
                    scrollTop: $("#internet-question").position().top
                }, 2000);
            }
        }, false);

        document.documentElement.style.display = 'block';
    })

    /* ACTIVITY */
    $(".activity").click(function(e) {
        $(this).siblings().removeClass("select");
        $(this).siblings().addClass("unselect");
        $(this).removeClass("unselect");
        $(this).addClass("select");

        $("html, body").animate({
            scrollTop: $("#submitSection").position().top
        }, 2000);
    })

    $("#move-speed").click(function(e) {
        $("html, body").animate({
            scrollTop: $("#question-speed").position().top
        }, 1500);
    })

    $("#move-consistency").click(function(e) {
        $("html, body").animate({
            scrollTop: $("#question-consistency").position().top
        }, 1500);
    })

    $("#move-test").click(function(e) {
        $("html, body").animate({
            scrollTop: $("#speedtest").position().top
        }, 1500);
    })

    $("#move-activity").click(function(e) {
        $("html, body").animate({
            scrollTop: $("#activitySection").position().top
        }, 1500);
    })

    if (isSlow) {
        $(".internet-slow>div.container").css("display", "block");
        $("#speedtest").css("visibility", "visible");
    } else {
        $(".internet-connection").css("display", "block");
        $("#info-area").css("visibility", "visible");
        $("#info-area").css("margin-top", "-300px");
        $("#speedtest").css("margin-bottom", "-350px");

        $("#addAP").on("click", function() {
            if ($("#apRead").val() == "")
                return;
            $("#apList").append("<p>" + $("#apRead").val() + '<button onclick="removeAP(this)" type="button" class="close" aria-label="Close"><span aria-hidden="true">&times;</span></button></p>');
            $("#apRead").val("");
        });
    }

    $("#finalStage").css("display", "block");
}

function turnOnSlow() {
    if (isSlow != "waiting") return;
    isSlow = true;
    turnOffIssue();

    $(".internet-slow>div.container").css("display", "block");
    $("#speedtest").css("visibility", "visible");
}

function turnOnConnection() {
    if (isSlow != "waiting") return;
    isSlow = false;
    turnOffIssue();

    $(".internet-connection").css("display", "block");
    $("#info-area").css("visibility", "visible");
    $("#info-area").css("margin-top", "-300px");
    $("#speedtest").css("margin-bottom", "-350px");

    $("#addAP").on("click", function() {
        if ($("#apRead").val() == "")
            return;
        $("#apList").append("<p>" + $("#apRead").val() + '<button onclick="removeAP(this)" type="button" class="close" aria-label="Close"><span aria-hidden="true">&times;</span></button></p>');
        $("#apRead").val("");
    });
}

function turnOffIssue() {
    $("#finalStage").css("display", "block");
}

function removeAP(e) {
    e.parentElement.remove()
}

function getListWifi() {
    var wifi = [];

    $("#apList p").each(function(index) {
        wifi.push($(this).html().split("<butto")[0]);
    });

    return wifi;
}

function collectData() {
    if (isSlow)
        $("#preview").html(
            "Speed: " + $("input[name='speed']:checked").attr("description") +
            "<br>Consistency: " + $("input[name='consistency']:checked").attr("description") +
            "<br> Download: " + $(".data.download").text() +
            "<br> Upload: " + $(".data.upload").text() +
            "<br> ping: " + $("#speedo-ping .data .time").text() + " ms" +
            "<br> IP address: " + $(".ip-address").text() +
            "<br> OS: " + $(".operation-system").text() +
            "<br> web: " + $(".browser-name").text() +
            "<br> Activity: " + $(".activity.select img").attr("type"));

    else {
        $("#preview").html(
            "기숙사 방 번호: " + $("#roomNumber").val() +
            "<br> Wi-Fi: " + getListWifi() +
            "<br> IP address: " + $(".ip-address").text() +
            "<br> OS: " + $(".operation-system").text() +
            "<br> web: " + $(".browser-name").text());
    }
}

function postSignature() {
    $(".form-alert").css("display", "none");
    if (isSlow) {
        /* Check whether all the question are filled. */
        var isValid = true;

        if ($(".data.download").text() == "--") {
            $("#form-test").css("display", "block");
            isValid = false;
        }

        if (!$(".activity.select").length) {
            $("#form-activity").css("display", "block");
            isValid = false;
        }

        if (isValid) {
            // createMap();
            initDB();
            // fetchMap();
            postUsers();
        }
    } else {
        /* Check whether all the question are filled. */
        var isValid = true;

        if ($("#roomNumber").val() == "") {
            $("#form-roomNumber").css("display", "block");
            isValid = false;
        }

        if (getListWifi().length == 0) {
            $("#form-wifi").css("display", "block");
            isValid = false;
        }

        if (isValid) {
            // createMap();
            initDB();
            // fetchMap();
            postUsers();
        }
    }

    return false;
}

function postUsers() {
    $('#submitSection').html("<i class='fa fa-circle-o-notch fa-spin'></i> Loading...");
    $('#submitSection').addClass('disabled');

    // Try HTML5 geolocation.
    if ("geolocation" in navigator) {
        // var location_timeout = setTimeout("alert('브라우저의 위치정보 수집이 불가합니다. 설정에서 승인 후 다시 시도해주세요.');", 10000);

        navigator.geolocation.getCurrentPosition(function(position) {
                center = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                // DEBUGGING purpose
                // center = kaist;
                var userID = generateID(5);

                if (isSlow) {
                    var playersRef = firebase.database().ref("users/" + [new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()].join("-") + "/" + userID);
                    // users/2017-3-6

                    playersRef.set({
                        "activity": $(".activity.select img").attr("type"),
                        "ip_addr": $(".ip-address ").text(),
                        "latitude": center.lat,
                        "longitude": center.lng,
                        "download": $(".data.download").text(),
                        "upload": $(".data.upload").text(),
                        "ping": $("#speedo-ping .data .time").text(),
                        "speed": $("input[name='speed']:checked").val(),
                        "consistency": $("input[name='consistency']:checked").val(),
                        "os": $(".operation-system").text(),
                        "web": $(".browser-name").text(),
                        "time": new Date().toString()
                    }, function(error) {
                        if (error) {
                            console.log(error);
                        } else {
                            // when post to DB is successful 
                            routeToVis(userID);
                        }

                    });
                } else {
                    var playersRef = firebase.database().ref("users/" + [new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()].join("-") + "/conn" + userID);
                    // users/2017-3-6

                    playersRef.set({
                        "room": $("#roomNumber").val(),
                        "wi-fi": getListWifi(),
                        "ip_addr": $(".ip-address ").text(),
                        "latitude": center.lat,
                        "longitude": center.lng,
                        "os": $(".operation-system").text(),
                        "web": $(".browser-name").text(),
                        "time": new Date().toString()
                    }, function(error) {
                        if (error) {
                            console.log(error);
                        } else {
                            // when post to DB is successful 
                            routeToVis("conn" + userID);
                        }

                    });
                }

            },
            function() { //error callback
                // clearTimeout(location_timeout);
                $('#submitSection').text('disabled');
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