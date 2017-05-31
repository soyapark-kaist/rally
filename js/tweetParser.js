/*!
 * tweetParser.js v2.2.0
 * Small Javascript Library that parse an element containing a tweet and turn URLS, @user & #hashtags into working urls
 * License : MIT
 * author Vincent Loy <vincent.loy1@gmail.com>
 * http://vincent-loy.fr
 */

/*global window, document*/
/*jslint regexp: true*/

(function(exports) {
    'use strict';

    // Class
    var tweetParser,

        // functions
        extend,
        generateLink,
        generateStyle;

    extend = function(out) {
        out = out || {};

        for (var i = 1; i < arguments.length; i += 1) {
            if (arguments[i]) {
                for (var key in arguments[i]) {
                    if (arguments[i].hasOwnProperty(key)) {
                        out[key] = arguments[i][key];
                    }
                }
            }
        }
        return out;
    };

    generateLink = function(url, className, target, text) {
        var link = document.createElement('a');
        link.href = url;
        link.classList.add(className);
        link.target = target;
        link.textContent = text;

        return link;
    };

    generateStyle = function(className, target, text) {
        var link = document.createElement('span');

        link.classList.add(className);
        link.target = target;
        link.textContent = text;

        return link;
    };

    tweetParser = function(element, args) {
        var elt = document.querySelectorAll(element),
            parameters = extend({
                urlClass: 'tweet_link',
                userClass: 'tweet_user',
                hashtagClass: 'hashtag',
                target: '_blank',
                searchWithHashtags: true,
                parseUsers: true,
                parseHashtags: true,
                parseUrls: true
            }, args);

        Array.prototype.forEach.call(elt, el => {

            const REGEX_URL = /(?:\s)(f|ht)tps?:\/\/([^\s\t\r\n<]*[^\s\t\r\n<)*_,\.])/g, //regex for urls
                REGEX_USER = /\B@([a-zA-Z0-9-ㄱ-ㅎ|ㅏ-ㅣ|가-힣_]+)/g, //regex for @users
                REGEX_HASHTAG = /\B(#[á-úÁ-Úä-üÄ-Üa-zA-Z0-9-ㄱ-ㅎ|ㅏ-ㅣ|가-힣_]+)/g; //regex for #hashtags

            var tweet = el.innerHTML,
                searchlink = "";

            //turn URLS in the tweet into... working urls
            if (parameters.parseUrls) {
                tweet = tweet.replace(REGEX_URL, function(url) {
                    var link = generateLink(url, parameters.urlClass, parameters.target, url);

                    return url.replace(url, link.outerHTML);
                });
            }

            //turn @users in the tweet into... working urls
            if (parameters.parseUsers) {
                tweet = tweet.replace(REGEX_USER, function(user) {
                    var userOnly = user.slice(1),
                        link = generateStyle(parameters.userClass, parameters.target, user);

                    return user.replace(user, link.outerHTML);
                });
            }

            //turn #hashtags in the tweet into... working urls
            if (parameters.parseHashtags) {
                tweet = tweet.replace(REGEX_HASHTAG, function(hashtag) {
                    var hashtagOnly = hashtag.slice(1),
                        link = generateStyle(parameters.hashtagClass, parameters.target, hashtag);

                    return hashtag.replace(hashtag, link.outerHTML);
                });
            }

            //then, it inject the last var into the element containing the tweet
            el.innerHTML = tweet;
        });
    };

    exports.tweetParser = tweetParser;
}(window));

/*global $, jQuery, tweetParser*/
if (window.jQuery) {
    (function($, tweetParser) {
        'use strict';

        function tweetParserify(el, options) {
            tweetParser(el, options);
        }

        $.fn.tweetParser = function(options) {
            return tweetParserify(this.selector, options);
        };
    }(jQuery, tweetParser));
}