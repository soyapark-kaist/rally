var kaist = {
    lat: 36.371,
    lng: 127.3624
};
var map, center;
var infoWindow;
var viewDate = 15; // Set how many dates for 

/* Initialize map. */
function createMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 15
    });
}
/* Initialize Firebase. */
function initDB() {
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
function fetchMap() {
    var playersRef = firebase.database().ref('users/');
    // Attach an asynchronous callback to read the data at our posts reference
    playersRef.on("value", function(snapshot) {

            var users = snapshot.val();
            var locations = [];
            var activities = [];

            for (var o in users) {
                var year = o.split("-")[0],
                    month = o.split("-")[1],
                    day = parseInt(o.split("-")[2]) + 1;

                if (calculateDiffDate(new Date(year, month - 1, day), new Date()) < viewDate) {
                    for (var u in users[o]) {
                        // debugger;
                        locations.push({
                            'lat': users[o][u].latitude,
                            'lng': users[o][u].longitude
                        })

                        activities.push(users[o][u].activity);
                        // console.log("here");
                    }

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
        },
        function(errorObject) {
            console.log("The read failed: " + errorObject.code);
        });
}

/* Error Handler when current location is not detectable. */
function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow = new google.maps.InfoWindow({ map: map });
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
        '브라우저의 위치정보 수집이 불가합니다. 설정에서 승인 후 다시 시도해주세요.' :
        '브라우저의 위치정보 수집이 불가합니다. 다른 브라우저에서 다시 시도해주세요.'
    );
}

/* Randomly generate unique ID. */
function generateID(inLength) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < inLength; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

/* Get difference between two dates. */
function calculateDiffDate(inDate1, inDate2) {
    return Math.ceil(Math.abs(inDate1.getTime() - inDate2.getTime()) / (1000 * 3600 * 24));
}

function routeToTimeline(inPetitionID) {
    var params = { id: inPetitionID };
    var p = jQuery.param(params);

    var newUrl = window.location.href.split("rally/")[0] + "rally/timeline.html?" + p;
    window.location.replace(newUrl);
}

function detectBrowser() {
    var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    return isSafari;
}

// function calcTime(city, offset) {
//     // create Date object for current location
//     var d = new Date();

//     // convert to msec
//     // subtract local time zone offset
//     // get UTC time in msec
//     var utc = d.getTime() - (d.getTimezoneOffset() * 60000);

//     // create new Date object for different city
//     // using supplied offset
//     var nd = new Date(utc + (3600000 * offset));

//     // return time as a string
//     return "The local time for city" + city + " is " + nd.toLocaleString();
// }