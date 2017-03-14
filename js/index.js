var clientId = '785081542704-6gbo1ku7lhdok50pai52n28adlfgpjva.apps.googleusercontent.com';
var apiKey = 'AIzaSyD9v41gd511lFHseGqCXwNyfpQyArNgZLQ';
var scopes =
    'https://www.googleapis.com/auth/gmail.readonly ' +
    'https://www.googleapis.com/auth/gmail.send';

function initDB() {
    toggleLoading("#loading");
    var config = {
        apiKey: "AIzaSyD9v41gd511lFHseGqCXwNyfpQyArNgZLQ",
        authDomain: "hello-3239c.firebaseapp.com",
        databaseURL: "https://hello-3239c.firebaseio.com",
        storageBucket: "hello-3239c.appspot.com",
        messagingSenderId: "785081542704"
    };
    firebase.initializeApp(config);

    var playersRef = firebase.database().ref("petition/");

    // Attach an asynchronous callback to read the data at our posts reference
    playersRef.on("value", function(snapshot) {
            var users = snapshot.val();
            var datas = {},
                download = [],
                upload = [];

            /* before append, remove previously added rows. */
            $('.table-inbox tbody').empty()

            for (var o in users) {
                var submitDate = new Date(users[o]["time-line"]["submit"]);
                var passed = new Date() > submitDate.setDate(submitDate.getDate() + 1);

                var progress = "";

                appendRow(o, users[o].title, users[o]["time-line"]["submit"].split(" GMT")[0], passed ? '정보통신팀에 전송' : '서명 모집 중');
            }

            toggleLoading("#loading");
        },
        function(errorObject) {
            alert("The read failed: " + errorObject.code);
        });
}

function appendRow(inID, inTitle, inDate, inProgress) {
    $('.table-inbox tbody').append(
        '<tr onclick="window.document.location=\'./timeline.html?id=' + inID + '\';">\
            <td>' + inTitle + '</td>\
            <td>' + inDate + '</td>\
            <td>' + inProgress + '</td>\
          </tr>'
    );
}