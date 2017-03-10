function initMap() {
    createMap();
    initDB();
    fetchMap();

    centerMap();
}

function centerMap() {
    map.setCenter(kaist);
}