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
                var playersRef = firebase.database().ref("petition/" + localStorage.getItem("petitionID"));

                playersRef.set({
                        "title": localStorage.getItem("title"),
                        "content": localStorage.getItem("content"),
                        "latitude": parseFloat(localStorage.getItem("latitude")),
                        "longitude": parseFloat(localStorage.getItem("longitude")),
                        "time-range": localStorage.getItem("time-range"),
                        "time-line": { "submit": localStorage.getItem("submit") }
                    },
                    function(error) {
                        if (error) {
                            console.log(error);
                        } else {
                            // when post to DB is successful 
                            routeToTimeline(localStorage.getItem("petitionID"));
                        }

                    });

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