var dbLoaded = false;
var isSafari = detectBrowser();
var users;
var filteredCnt = 0; // # of signature filtered
var petitionID = generateID(8);

$(function() {
    toggleLoading("#loading");

    initDB();

    $('[data-toggle="tooltip"]').tooltip();
    $('#petitionForm').submit(function(event) {
        event.preventDefault();
        postPetition();
    });

    var bldgRef = firebase.database().ref("bldg/");
    // Attach an asynchronous callback to read the data at our posts reference
    bldgRef.once("value").then(function(snapshot) {
        var BLDG = snapshot.val();

        var bldgsName = [];
        for (var b in BLDG) {
            bldgsName.push(BLDG[b].name);
        }

        $("#buildingSearch").autocomplete({
            source: bldgsName,
            open: function() {
                $("#ui-id-1").append('<li class="ui-menu-item" role="presentation"><a class="ui-corner-all" tabindex="-1" onclick="clearSearch()">찾는 건물이 없으면 지도에서 장소를 클릭하세요</a></li>');
            },
            select: function(event, ui) {
                if (ui) { //then center on map 
                    for (var b in BLDG) {
                        if (BLDG[b].name == ui.item.value) {
                            $('#map').locationpicker({
                                location: {
                                    latitude: BLDG[b].lat,
                                    longitude: BLDG[b].lng
                                },
                                radius: 70
                            });
                            break;
                        }
                    }
                }
            }
        });
    });


})

function initMap() {
    createMap();
    // displayMap();
    initLocationPicker();
    google.maps.event.addListener(map, 'click', function(event) {
        $('#map').locationpicker({
            location: {
                latitude: event.latLng.lat(),
                longitude: event.latLng.lng()
            },
            radius: 70
        });
    });

    initTimeRangeWidget();

    toggleLoading("#loading");
}

function initLocationPicker() {
    /* Add location picker plug-in. */
    src = "js/locationpicker.jquery.js";
    script = document.createElement('script');
    script.onerror = function() {
        // handling error when loading script
        alert('Error to handle')
    }
    script.onload = function() {
        console.log(src + ' loaded ')

        displayLocationPicker();
    }
    script.src = src;
    document.getElementsByTagName('head')[0].appendChild(script);
}

function clearSearch() {
    $('#buildingSearch').val("");
    $('#buildingSearch').autocomplete('close');
}

function displayLocationPicker() {
    $('#map').locationpicker({
        location: {
            latitude: kaist.lat,
            longitude: kaist.lng
        },
        radius: 70
    }, map);
    map.setZoom(16);
}

function initTimeRangeWidget() {
    /* Add time range plug-in. */
    $('#timeRange-start').timepicker({
        'step': 60,
        'timeFormat': 'H:i'
    });

    // In case, time is selected before reload.
    if ($('#timeRange-start').val() != "")
        $("#viewSignature").prop('disabled', false);

    $('#timeRange-start').on('changeTime', function() {
        if ($(this).val() != "")
            $("#viewSignature").prop('disabled', false);
        var dstTime = (parseInt($(this).val().split(":")[0]) + 3) % 24;
        $('#timeRange-end').attr("placeholder", dstTime.toString() + ":00");
        //text($(this).val());
    });
}

function preview() {
    $("#preview").html(
        "title: " + $("#title").val() +
        "<br>content: " + $("#content").val() +
        "<br>latitude: " + $('#map').locationpicker("location").latitude +
        "<br>longitude: " + $('#map').locationpicker("location").longitude +
        "<br>time-range: " + $('#timeRange-start').val());
}



function postPetition() {
    /* Check whether all the question are filled. */
    if (isSafari) {
        if ($("input[name='time-range']:checked").length == 0) {
            alert("시간 대를 선택해주세요.");
            $("input[name='time-range']").focus();
            // e.preventDefault();
            return false;
        }

        if ($("input[name='day-range']:checked").length == 0) {
            alert("어느 날에 일어나는지 선택해주세요.");
            $("input[name='day-range']").focus();
            // e.preventDefault();
            return false;
        }

        if ($("#title").val() == '') {
            // alert("시간 대를 선택해주세요.");

            $("#title").focus();
            $("#form-title").css("display", "block");
            // e.preventDefault();
            return false;
        }

        if ($("#content").val() == '') {
            // alert("시간 대를 선택해주세요.");

            $("#content").focus();
            $("#form-content").css("display", "block");
            // e.preventDefault();
            return false;
        }
    }

    var $btn = $('#submitSection').button('loading');
    var lat, lng;

    //then save input to local storage

    // Check whether the user is authenticated
    var user = firebase.auth().currentUser;

    // User is signed in.
    if (user) {
        //route to timeline.html
        var playersRef = firebase.database().ref("petition/" + petitionID);

        playersRef.set({
                "title": $("#title").val(),
                "content": $("#content").val(),
                "latitude": $('#map').locationpicker("location").latitude,
                "longitude": $('#map').locationpicker("location").longitude,
                "bldg": $("#buildingSearch").val(),
                "time-range": $("input[name='time-range']:checked").val(),
                "day-range": $("input[name='day-range']:checked").val(),
                "time-line": {
                    "submit": new Date().toString()
                },
                "quorum": SLOW_TOTAL,
                "email": user.email ? user.email : "***"
            },
            function(error) {
                if (error) {
                    console.log(error);
                } else {
                    // when post to DB is successful 
                    alert("제출되었습니다. 관리자 승인 후 캠페인이 시작됩니다.");
                    window.location.replace("./others.html");
                }

            });
    }
    // No user is signed in.
    else {
        //then route to login page(login.html)
        //route to login.html
        localStorage.setItem("code", "0");
        localStorage.setItem("petitionID", petitionID);
        localStorage.setItem("title", $("#title").val());
        localStorage.setItem("content", $("#content").val());
        localStorage.setItem("latitude", $('#map').locationpicker("location").latitude);
        localStorage.setItem("longitude", $('#map').locationpicker("location").longitude);
        localStorage.setItem("bldg", $("#buildingSearch").val());
        localStorage.setItem("time-range", $("input[name='time-range']:checked").val());
        localStorage.setItem("day-range", $("input[name='day-range']:checked").val());
        localStorage.setItem("submit", new Date().toString());

        window.location.replace("./login.html");
        return false;
    }

    $btn.button('reset');
    return false;
}