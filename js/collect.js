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
}


/* Scroll to submit section*/
// $("#submitSection").click(function() {

// })

function collectData() {
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
}

function postSignature() {
    $(".form-alert").css("display", "none");

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

    return false;
}

function postUsers() {
    $('#submitSection').html("<i class='fa fa-circle-o-notch fa-spin'></i> Loading...");
    $('#submitSection').addClass('disabled');

    // Try HTML5 geolocation.
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            center = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            // DEBUGGING purpose
            // center = kaist;

            // var playersRef = firebase.database().ref("users/" + generateID(5));
            var userID = generateID(5);
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
        }, function() {
            console.log("Error geolocation");
            // handleLocationError(true, infoWindow, map.getCenter());
        });
    } else {
        // Browser doesn't support Geolocation
        console.log("Error geolocation; brower doesn't support");
        // handleLocationError(false, infoWindow, map.getCenter());
    }

}