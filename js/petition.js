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
            // var markerCluster = new MarkerClusterer(map, markers, {
            //     imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'
            // });

            // // markerCluster.clearMarkers();
            // // // markerCluster.refresh();
            for (var i = 0; i < markers.length; i++) {
                markers[i].setOptions({ map: map, visible: true });
            }



            // google.maps.event.addListener(markerCluster, 'mouseover', function(cluster) {
            //     // your code here
            //     console.log(cluster.markers_)
            //     var contentString = "<div>" + cluster.markers_[0].activity +
            //         "</div>"
            //     var infoW = new google.maps.InfoWindow({
            //         content: contentString
            //     });
            //     infoW.setPosition(cluster.getCenter().lat(), cluster.getCenter().lng());

            // });

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

            $('#map').locationpicker({
                location: {
                    latitude: center.lat,
                    longitude: center.lng
                },
                radius: 300
            }, map);
            map.setZoom(16);

            // infoWindow.setPosition(pos);
            // infoWindow.setContent('Location found.');
        }, function() {
            handleLocationError(true, infoWindow, map.getCenter());
        });
    } else {
        // Browser doesn't support Geolocation
        handleLocationError(false, infoWindow, map.getCenter());
    }


    // debugger;
    src = "js/locationpicker.jquery.js";
    script = document.createElement('script');
    script.onerror = function() {
        // handling error when loading script
        alert('Error to handle')
    }
    script.onload = function() {
        console.log(src + ' loaded ')
            // callback();

    }
    script.src = src;
    document.getElementsByTagName('head')[0].appendChild(script);


}

function doSubmit() {
    initMap();
}

function makeid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 5; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}