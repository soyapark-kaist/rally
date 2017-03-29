initDB();

// FirebaseUI config.
var uiConfig = {
    // Url to redirect to after a successful sign-in.
    'signInSuccessUrl': './timeline.html?id=' + localStorage.getItem("petitionID"),
    'callbacks': {
        'signInSuccess': function(user, credential, redirectUrl) {
            if (window.opener) {
                // The widget has been opened in a popup, so close the window
                // and return false to not redirect the opener.
                window.close();
                return false;
            } else {
                if (localStorage.getItem("petition") == "true") {
                    var playersRef = firebase.database().ref("petition/" + localStorage.getItem("petitionID"));

                    playersRef.set({
                            "title": localStorage.getItem("title"),
                            "content": localStorage.getItem("content"),
                            "latitude": parseFloat(localStorage.getItem("latitude")),
                            "longitude": parseFloat(localStorage.getItem("longitude")),
                            "bldg": localStorage.getItem("bldg"),
                            "time-range": localStorage.getItem("time-range"),
                            "day-range": localStorage.getItem("day-range"),
                            "time-line": { "submit": localStorage.getItem("submit") },
                            "email": firebase.auth().currentUser.email
                        },
                        function(error) {
                            if (error) {
                                console.log(error);
                            } else {
                                // when post to DB is successful 
                                // when post to DB is successful 
                                alert("제출되었습니다. 관리자 승인 후 캠페인이 시작됩니다.");
                                window.location.replace("./others.html");
                            }

                        });

                } else {
                    if (localStorage.getItem("conn") == "false") {
                        var playersRef = firebase.database().ref("users/" + [new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()].join("-") + "/" + generateID(5));
                        // users/2017-3-6

                        playersRef.set({
                                "type": localStorage.getItem("type"),
                                "bldg": localStorage.getItem("bldg"),
                                "latitude": parseFloat(localStorage.getItem("latitude")),
                                "longitude": parseFloat(localStorage.getItem("longitude")),
                                "ip_addr": localStorage.getItem("ip_addr"),
                                "os": localStorage.getItem("os"),
                                "web": localStorage.getItem("web"),
                                "time": localStorage.getItem("time"),

                                "activity": localStorage.getItem("activity"),
                                "download": localStorage.getItem("download"),
                                "upload": localStorage.getItem("upload"),
                                "ping": localStorage.getItem("ping"),
                                "speed": localStorage.getItem("speed"),
                                "consistency": localStorage.getItem("consistency"),
                                "email": firebase.auth().currentUser.email
                            },
                            function(error) {
                                if (error) {
                                    console.log(error);
                                } else {
                                    // when post to DB is successful 
                                    var pRef = firebase.database().ref('petition-meta/' + localStorage.getItem("bldg"));
                                    // Attach an asynchronous callback to read the data at our posts reference
                                    pRef.once("value").then(function(snapshot) {
                                        routeToTimeline(snapshot.val());
                                    });
                                }

                            });

                    } else {
                        var playersRef = firebase.database().ref("users/" + [new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()].join("-") + "/" + "conn" + generateID(5));
                        // users/2017-3-6/conn

                        playersRef.set({
                                "type": localStorage.getItem("type"),
                                "bldg": localStorage.getItem("bldg"),
                                "latitude": parseFloat(localStorage.getItem("latitude")),
                                "longitude": parseFloat(localStorage.getItem("longitude")),
                                "ip_addr": localStorage.getItem("ip_addr"),
                                "os": localStorage.getItem("os"),
                                "web": localStorage.getItem("web"),
                                "time": localStorage.getItem("time"),

                                "room": localStorage.getItem("room"),
                                "welcome_kaist": localStorage.getItem("welcome_kaist"),
                                "wi-fi": localStorage.getItem("wi-fi"),
                                "email": firebase.auth().currentUser.email
                            },
                            function(error) {
                                if (error) {
                                    console.log(error);
                                } else {
                                    // when post to DB is successful 
                                    var pRef = firebase.database().ref('petition-meta/' + localStorage.getItem("bldg"));
                                    // Attach an asynchronous callback to read the data at our posts reference
                                    pRef.once("value").then(function(snapshot) {
                                        routeToTimeline(snapshot.val());
                                    });
                                }

                            });
                    }
                }

                // The widget has been used in redirect mode, so we redirect to the signInSuccessUrl.

            }
        }
    },
    'signInOptions': [
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        firebase.auth.FacebookAuthProvider.PROVIDER_ID,
        firebase.auth.TwitterAuthProvider.PROVIDER_ID
    ],
    // Terms of service url.
    'tosUrl': 'https://kixlab.org/rally2/privacy.html'
};

// Initialize the FirebaseUI Widget using Firebase.
var ui = new firebaseui.auth.AuthUI(firebase.auth());
// The start method will wait until the DOM is loaded to include the FirebaseUI sign-in widget
// within the element corresponding to the selector specified.
ui.start('#firebaseui-auth-container', uiConfig);

/*
$(function() {
    // var auth = app.auth();
    var user = firebase.auth().currentUser;

    var email = "soya@kaist.ac.kr"
    var password = "mypassword"

    firebase.auth().createUserWithEmailAndPassword(email, password).catch(function(error) {
        // Handle Errors here.
        if (error.code == "auth/email-already-in-use")
            alert("인증된 메일입니다. 다음 화면으로 넘어갑니다")
    });

    firebase.auth().onAuthStateChanged(function(user) {

        if (user.emailVerified) {
            console.log('Email is verified');
        } else {
            console.log('Email is not verified');
            user.sendEmailVerification();
        }
    });

})
*/