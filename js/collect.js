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

    $("#move-bldg").click(function(e) {
        $("html, body").animate({
            scrollTop: $("#map").position().top
        }, 1500);
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

    fill_progress_circle(0);

    initDB();
    createMap();
    map.setCenter(kaist);

    initRangeSlider();
    initGuideImg();

    $("#finalStage").css("display", "block");
}

var markers = [];

function displayBldgList() {
    // Try HTML5 geolocation.
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(function(position) {
                center = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                // DEBUGGING purpose
                // center = {
                //     "lat": 36.373732,
                //     "lng": 127.358535
                // };

                function nextChar(c) {
                    return String.fromCharCode(c.charCodeAt(0) + 1);
                }


                var list = [],
                    cnt = 0,
                    alphabet = 'A';

                var bldgRef = firebase.database().ref("bldg/");
                // Attach an asynchronous callback to read the data at our posts reference
                bldgRef.once("value").then(function(snapshot) {
                    var BLDG = snapshot.val();

                    for (var l in BLDG) {
                        if (Math.abs(center.lat - BLDG[l].lat) < 0.001 && Math.abs(center.lng - BLDG[l].lng) < 0.001) {
                            $('.building-list tbody').append(
                                '<tr bldg=' + l + ' onclick="animateMarker(' + (cnt++) + ')">\
                               <td>' + alphabet + '</td>\
                               <td>' + BLDG[l].name + '</td>\
                               </tr>');

                            list.push({ "lat": BLDG[l].lat, "lng": BLDG[l].lng, label: alphabet });

                            alphabet = nextChar(alphabet);
                        }
                    }

                    var bounds = new google.maps.LatLngBounds();
                    list.forEach(function(data, index, array) {
                        var marker = new google.maps.Marker({
                            position: new google.maps.LatLng(list[index].lat, list[index].lng),
                            map: map,
                            label: list[index].label
                        });
                        markers.push(marker);

                        bounds.extend(marker.position);
                    });
                    map.fitBounds(bounds);

                });


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

var preIndex = -1;

function animateMarker(index) {
    if (preIndex != -1)
        markers[preIndex].setAnimation(null);

    $(".building-list tr").removeClass("warning");
    $(".building-list tr").eq(index).addClass("warning");

    preIndex = index;

    if (markers[index].getAnimation() != google.maps.Animation.BOUNCE) {
        markers[index].setAnimation(google.maps.Animation.BOUNCE);
    } else {
        markers[index].setAnimation(null);
    }
}

function pickInternetType(isIndex) {
    $(".internet-type a").removeClass("active");

    $(".internet-type a").eq(isIndex).addClass("active");

    return false;
}

function pickIssueType(isSlow) {
    $("#speedtest-area").toggle();
    $(".result-area").toggle();
    $(".issue-type a").toggleClass("active");

    if (isSlow) {} else {
        // $("#speedtest").css("margin-bottom", "-350px");

        $("#addAP").on("click", function() {
            if ($("#apRead").val() == "")
                return;
            $("#apList").append("<p>" + $("#apRead").val() + '<button onclick="removeAP(this)" type="button" class="close" aria-label="Close"><span aria-hidden="true">&times;</span></button></p>');
            $("#apRead").val("");
        });


    }

    return false;
}

function turnOnSlow() {
    turnOffIssue();

    $(".internet-slow>div.container").css("display", "block");
    $("#speedtest").css("visibility", "visible");
}

function turnOnConnection() {
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

function isIssueConn() {
    return $(".issue-type a.active").attr("href") == "#conn";
}

function initGuideImg() {
    // Set AP screenshot depending on the os
    var myOS = detectOS();
    var imgSrc;
    switch (myOS) {
        case 'ios':
            imgSrc = "ios.png";
            break;
        case 'android':
            imgSrc = "android.png";
            break;
        case 'mac':
            imgSrc = "mac.png";
            break;
        case 'windows':
            imgSrc = "windows.png";
            break;
        default:
            imgSrc = "android.png";
    }

    imgSrc = 'img/' + imgSrc;
    $(".tooltiptext img").attr("src", imgSrc);
}

function initRangeSlider() {
    var slider = $('.range-slider'),
        range = $('.range-slider__range'),
        value = $('.antenna');

    slider.each(function() {

        value.each(function() {
            var value = $(this).prev().attr('value');
            $(this).text(value);
        });

        range.on('input', function() {
            value.text(this.value);
        });
    });
};

function collectData() {
    if (isIssueConn())
        $("#preview").html(
            "기숙사 방 번호: " + $("#roomNumber").val() +
            "<br> Welcome_KAIST 강도: " + $(".antenna").text() + "%" +
            "<br> Wi-Fi: " + getListWifi() +
            "<br> IP 주소: " + $(".ip-address").text() +
            "<br> OS: " + $(".operation-system").text() +
            "<br> web: " + $(".browser-name").text());

    else
        $("#preview").html(
            "속도: " + $("input[name='speed']:checked").attr("description") +
            "<br>일정성: " + $("input[name='consistency']:checked").attr("description") +
            "<br> Download: " + $(".data.download").text() +
            "<br> Upload: " + $(".data.upload").text() +
            "<br> ping: " + $("#speedo-ping .data .time").text() + " ms" +
            "<br> IP 주소: " + $(".ip-address").text() +
            "<br> OS: " + $(".operation-system").text() +
            "<br> web: " + $(".browser-name").text() +
            "<br> 활동: " + $(".activity.select img").attr("type"));
}

function postSignature() {
    $(".form-alert").css("display", "none");

    var isValid = true;

    if ($('.building-list tr.warning').length == 0) {
        $("#form-bldg").css("display", "block");
        isValid = false;
    }

    if (isIssueConn()) {
        /* Check whether all the question are filled. */

        if ($("#roomNumber").val() == "") {
            $("#form-roomNumber").css("display", "block");
            isValid = false;
        }

        if (getListWifi().length == 0) {
            $("#form-wifi").css("display", "block");
            isValid = false;
        }


    } else {
        /* Check whether all the question are filled. */

        if ($(".data.download").text() == "--") {
            $("#form-test").css("display", "block");
            isValid = false;
        }

        if (!$(".activity.select").length) {
            $("#form-activity").css("display", "block");
            isValid = false;
        }
    }

    if (isValid) {
        postUsers();
    }

    return false;
}

function postUsers() {
    $('#submitSection').html("<i class='fa fa-circle-o-notch fa-spin'></i> Loading...");
    $('#submitSection').addClass('disabled');

    // DEBUGGING purpose
    // center = kaist;
    var userID = generateID(5);
    var type;

    // Check whether the user is authenticated
    var user = firebase.auth().currentUser;

    // User is signed in.
    if (user) {
        if (!isIssueConn()) {
            var playersRef = firebase.database().ref("users/" + [new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()].join("-") + "/" + userID);
            // users/2017-3-6

            playersRef.set({
                "type": $(".internet-type a.active").attr("conn-type"),
                "bldg": $('.building-list tr.warning').attr("bldg"),
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
                "time": new Date().toString(),
                "email": user.email
            }, function(error) {
                if (error) {
                    console.log(error);
                } else {
                    var playersRef = firebase.database().ref('bldg/' + $('.building-list tr.warning').attr("bldg"));
                    // Attach an asynchronous callback to read the data at our posts reference
                    playersRef.once("value").then(function(snapshot) {
                        routeToTimeline(snapshot.val().url);
                    });
                }

            });
        } else {
            var playersRef = firebase.database().ref("users/" + [new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()].join("-") + "/" + "conn" + userID);
            // users/2017-3-6/conn~~

            playersRef.set({
                "type": $(".internet-type a.active").attr("conn-type"),
                "bldg": $('.building-list tr.warning').attr("bldg"),
                "room": $("#roomNumber").val(),
                "welcome_kaist": $(".antenna").text(),
                "wi-fi": getListWifi(),
                "ip_addr": $(".ip-address ").text(),
                "latitude": center.lat,
                "longitude": center.lng,
                "os": $(".operation-system").text(),
                "web": $(".browser-name").text(),
                "time": new Date().toString(),
                "email": user.email
            }, function(error) {
                if (error) {
                    console.log(error);
                } else {
                    var playersRef = firebase.database().ref('bldg/' + $('.building-list tr.warning').attr("bldg"));
                    // Attach an asynchronous callback to read the data at our posts reference
                    playersRef.once("value").then(function(snapshot) {
                        routeToTimeline(snapshot.val().url);

                    });
                }

            });
        }
    }
    // No user is signed in.
    else {
        localStorage.setItem("type", $(".internet-type a.active").attr("conn-type"));
        localStorage.setItem("bldg", $('.building-list tr.warning').attr("bldg"));
        localStorage.setItem("latitude", center.lat);
        localStorage.setItem("longitude", center.lng);
        localStorage.setItem("ip_addr", $(".ip-address ").text());
        localStorage.setItem("os", $(".operation-system").text());
        localStorage.setItem("web", $(".browser-name").text());
        localStorage.setItem("time", new Date().toString());

        //then route to login page(login.html)
        //route to login.html
        if (!isIssueConn()) {
            localStorage.setItem("conn", false);
            localStorage.setItem("activity", $(".activity.select img").attr("type"));
            localStorage.setItem("download", $(".data.download").text());
            localStorage.setItem("upload", $(".data.upload").text());
            localStorage.setItem("ping", $("#speedo-ping .data .time").text());
            localStorage.setItem("speed", $("input[name='speed']:checked").val());
            localStorage.setItem("consistency", $("input[name='consistency']:checked").val());
        } else {
            localStorage.setItem("conn", true);
            localStorage.setItem("room", $("#roomNumber").val());
            localStorage.setItem("welcome_kaist", $(".antenna").text());
            localStorage.setItem("wi-fi", getListWifi());
        }

        window.location.replace("./login.html");

    }

    return false;
}