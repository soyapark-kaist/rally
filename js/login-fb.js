window.fbAsyncInit = function() {
    FB.init({
        appId: '1897384577143687',
        cookie: true, // enable cookies to allow the server to access 
        // the session
        xfbml: true, // parse social plugins on this page
        version: 'v2.8' // use graph api version 2.8
    });

    // Now that we've initialized the JavaScript SDK, we call 
    // FB.getLoginStatus().  This function gets the state of the
    // person visiting this page and can return one of three states to
    // the callback you provide.  They can be:
    //
    // 1. Logged into your app ('connected')
    // 2. Logged into Facebook, but not your app ('not_authorized')
    // 3. Not logged into Facebook and can't tell if they are logged into
    //    your app or not.
    //
    // These three cases are handled in the callback function.

    checkLoginState();

};

// // Load the SDK asynchronously
// (function(d, s, id) {
//     var js, fjs = d.getElementsByTagName(s)[0];
//     if (d.getElementById(id)) return;
//     js = d.createElement(s);
//     js.id = id;
//     js.src = "//connect.facebook.net/en_US/sdk.js";
//     fjs.parentNode.insertBefore(js, fjs);
// }(document, 'script', 'facebook-jssdk'));

// This is called with the results from from FB.getLoginStatus().
function statusChangeCallback(response) {
    console.log('statusChangeCallback');
    console.log(response);
    // The response object is returned with a status field that lets the
    // app know the current login status of the person.
    // Full docs on the response object can be found in the documentation
    // for FB.getLoginStatus().
    if (response.status === 'connected') {
        // Logged into your app and Facebook.
    } else {
        // The person is not logged into your app or we are unable to tell.
        console.log('Please log into this app.');
    }
}

// Facebook login with JavaScript SDK
function fbLogin() {
    FB.login(function(response) {
        if (response.authResponse) {
            // Get and display the user profile data
            getFbUserData();
        } else {
            console.log("not logged in yet");
        }
    }, {
        scope: 'email'
    });
}

// Fetch the user profile data from facebook
function getFbUserData() {
    FB.api('/me', {
            locale: 'en_US',
            fields: 'name,email'
        },
        function(response) {
            USERID = response.id;
            USERNAME = response.name;
            EMAIL = response.email;

            setLogin(true);

            fetchUserLog();

            // hide popover
            $(document).on('focus', ':not(.popover)', function() {
                $('.popover').popover('hide');
            });
        });
}