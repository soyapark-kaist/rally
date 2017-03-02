var kaist = {
    lat: 36.3694,
    lng: 127.3640
};
var map, center;
var infoWindow;

function createMap() {
    /* Initialize map */
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16
    });

    infoWindow = new google.maps.InfoWindow({ map: map });
}

function initDB() {
    /* Initialize Firebase */
    var config = {
        apiKey: "AIzaSyD9v41gd511lFHseGqCXwNyfpQyArNgZLQ",
        authDomain: "hello-3239c.firebaseapp.com",
        databaseURL: "https://hello-3239c.firebaseio.com",
        storageBucket: "hello-3239c.appspot.com",
        messagingSenderId: "785081542704"
    };
    firebase.initializeApp(config);
}

/* Fetch data points from DB & Push markers on the map. */
function displayMap() {
    var playersRef = firebase.database().ref('users/');
    // Attach an asynchronous callback to read the data at our posts reference
    playersRef.on("value", function(snapshot) {

            var users = snapshot.val();
            var locations = [];
            var activities = [];

            for (var o in users) {
                locations.push({
                    'lat': users[o].latitude,
                    'lng': users[o].longitude
                })
                console.log(users[o])
                console.log(users[o].activity)
                activities.push(users[o].activity)
                    // debugger;
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
            // var markerCluster = new MarkerClusterer(map, markers, {
            //     imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'
            // });

            // // markerCluster.clearMarkers();
            // // // markerCluster.refresh();
            for (var i = 0; i < markers.length; i++) {
                markers[i].setOptions({ map: map, visible: true });
            }
        },
        function(errorObject) {
            console.log("The read failed: " + errorObject.code);
        });
}

function new google.maps.Map(document.getElementById('map')(browserHasGeolocation, infoWindow, pos) {
        infoWindow.setPosition(pos);
        infoWindow.setContent(browserHasGeolocation ?
            '브라우저의 위치정보 수집이 불가합니다. 설정에서 승인 후 다시 시도해주세요.' :
            'Error: Your browser doesn\'t support geolocation.');
    }

    function generateID(length) {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (var i = 0; i < length; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }
}

if (isValid) {
    createMap();
    initDB();
    displayMap();
    postUsers();
}

}

function postUsers() {
    // Try HTML5 geolocation.
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            center = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            // DEBUGGING purpose
            // center = kaist;

            var playersRef = firebase.database().ref("users/" + generateID(5));

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
                "time": new Date().toString()
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