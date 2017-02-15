var map, center;

function initMap() {
    var kaist = {
        lat: 36.3694,
        lng: 127.3640
    };

    /* Initialize map */
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16
    });

    // var infoWindow = new google.maps.InfoWindow({
    //     map: map
    // });

    /* Initialize Firebase */
    var config = {
        apiKey: "AIzaSyD9v41gd511lFHseGqCXwNyfpQyArNgZLQ",
        authDomain: "hello-3239c.firebaseapp.com",
        databaseURL: "https://hello-3239c.firebaseio.com",
        storageBucket: "hello-3239c.appspot.com",
        messagingSenderId: "785081542704"
    };
    firebase.initializeApp(config);
    // var firebase = new Firebase('https://hello-3239c.firebaseio.com/');

    var playersRef = firebase.database().ref('/');
    // Attach an asynchronous callback to read the data at our posts reference
    playersRef.on("value", function(snapshot) {
            var users = snapshot.val();
            var locations = [];
            var activities = [];

            for (var o in users) {
                for (var report in users[o]) {
                    locations.push({
                        'lat': users[o][report].latitude,
                        'lng': users[o][report].longtitude
                    })
                    console.log(users[o][report].activity)
                    activities.push(users[o][report].activity)
                        // debugger;
                }
            }

            // Create an array of alphabetical characters used to label the markers.
            var labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

            var markers = locations.map(function(location, i) {
                var image = {
                    url: 'img/activity/' + activities[i] + '.png',
                    scaledSize: new google.maps.Size(30, 30)
                };
                return new google.maps.Marker({
                    position: location,
                    activity: activities[i],
                    icon: image
                });
            });

            // Add a marker clusterer to manage the markers.
            var markerCluster = new MarkerClusterer(map, markers, {
                imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'
            });

            markerCluster.clearMarkers();
            // markerCluster.refresh();
            for (var i = 0; i < markers.length; i++) {
                markers[i].setOptions({ map: map, visible: true });
            }

        },
        function(errorObject) {
            console.log("The read failed: " + errorObject.code);
        });

    // Try HTML5 geolocation.
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            center = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            var playersRef = firebase.database().ref("users/" + makeid());
            var id = makeid()
            var data = {};
            data[makeid()] = {

            };

            playersRef.set({
                "activity": $(".activity.select img ").attr("type"),
                "ip_addr": $(".ip-address ").text(),
                "latitude": position.coords.latitude,
                "longtitude": position.coords.longitude
            });

            // infoWindow.setPosition(pos);
            // infoWindow.setContent('Location found.');
            map.setCenter(center);
        }, function() {
            handleLocationError(true, infoWindow, map.getCenter());
        });
    } else {
        // Browser doesn't support Geolocation
        handleLocationError(false, infoWindow, map.getCenter());
    }




}

function initListener() {
    /* INTERNET */
    $(".speed li").click(function(e) {
        $(this).siblings().removeClass("active");
        $(this).addClass("active");
    });

    $(".consistency li").click(function(e) {
        $(this).siblings().removeClass("active");
        $(this).addClass("active");
    });

    /* Scroll to activity section */
    $("#speedo-start").click(function() {
        document.documentElement.addEventListener('DOMAttrModified', function(e) {
            if (e.attrName === 'style' && e.target.id == "ready" && e.newValue == "display: block;") {
                console.log("Test over. Download: " + $(".data.download").text() + ". Upload: " + $(".data.upload").text())

                $("html, body").animate({
                    scrollTop: $("#activitySection").position().top
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
}


/* Scroll to submit section*/
// $("#submitSection").click(function() {

// })

function collectData() {
    $("#preview").html(
        "Speed: " + $(".speed .active").text() +
        "<br>Consistency: " + $(".consistency .active").text() +
        "<br> Download: " + $(".data.download").text() +
        "<br> Upload: " + $(".data.upload").text() +
        "<br> ping: " + $("#speedo-ping .data .time").text() + " ms" +
        "<br> IP address: " + $(".ip-address").text() +
        "<br> Activity: " + $(".activity.select img").attr("type"));
}

function doSubmit() {
    initMap();
    postData();
}

function postData() {

}

function makeid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 5; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}