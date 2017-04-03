var clientId = '785081542704-6gbo1ku7lhdok50pai52n28adlfgpjva.apps.googleusercontent.com';
var apiKey = 'AIzaSyD9v41gd511lFHseGqCXwNyfpQyArNgZLQ';

function initMap() {
    toggleLoading("#loading");
    $("#today").text($("#today").text() + "(" + [new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()].join("-") + ")");
    createMap();
    initLegend();
    initDB();
    markMap(null);


    map.setCenter(kaist);

    infoWindow = new google.maps.InfoWindow({ map: map });
    infoWindow.close();

    var bldgRef = firebase.database().ref("bldg/");
    // Attach an asynchronous callback to read the data at our posts reference
    bldgRef.once("value").then(function(snapshot) {
        var bldgs = snapshot.val();
        var bounds = new google.maps.LatLngBounds();

        for (var p in bldgs) {
            p = parseInt(p);

            // Add the circle for the petition to the map.
            var marker = createMarker(bldgs[p].url, { lat: bldgs[p].lat, lng: bldgs[p].lng }, bldgs[p].name);
            bounds.extend({ lat: bldgs[p].lat, lng: bldgs[p].lng });

            marker.addListener('click', function(e) {
                infoWindow.open(map);
                infoWindow.setContent(this.title + " <a class='btn btn-primary' href='./timeline.html?id=" + this.petitionID + "&sharing=true' onclick='trackOutboundLink(\"./timeline.html\", \"marker\");return false;'>자세히 보기</a>");
                infoWindow.setPosition(this.getPosition());
            });


        }

        map.fitBounds(bounds);

        toggleLoading("#loading");
    });


}