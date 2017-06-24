/*
 *
 *  Copyright 2015 Google Inc. All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License
 *
 */

// Version 0.57

// self.addEventListener('install', e => {
//     e.waitUntil(
//         caches.open('rally42').then(cache => {
//             return cache.addAll([
//                     '512Mb.zip',
//                     'index.html',
//                     'collect.html',
//                     'others.html',
//                     'petition.html',
//                     'timeline.html',
//                     'login.html',
//                     'js/jquery.min.js',
//                     'js/bootstrap.min.js',
//                     'js/rally.js',
//                     'js/collect.js',
//                     'js/donutChart.js',
//                     'js/login.js',
//                     'js/petition.js',
//                     'js/others.js',
//                     'js/timeline.js',
//                     'css/bootstrap.min.css',
//                     'css/font-awesome.min.css',
//                     'css/custom.css',
//                     'css/theme.css',
//                     'css/collect.css',
//                     'css/timeline.css',
//                     'css/petition.css',
//                     'img/achome_beta_brand.png',
//                     'img/ios.png'
//                     // '/index.html?homescreen=1',
//                     // '/?homescreen=1',
//                     // '/styles/main.css',
//                     // '/scripts/main.min.js',
//                 ])
//                 .then(() => self.skipWaiting());
//         })
//     )
// });

// self.addEventListener('activate', event => {
//     event.waitUntil(self.clients.claim());
// });

// self.addEventListener('fetch', event => {
//     // console.log(event.request.url);
//     event.respondWith(
//         caches.match(event.request).then(response => {
//             return response || fetch(event.request);
//         })
//     );
// });

var CACHE_VERSION = 22;
var CURRENT_CACHES = {
    prefetch: 'prefetch-cache-v' + CACHE_VERSION
};

self.addEventListener('install', function(event) {
    var now = Date.now();

    var urlsToPrefetch = [
        '512Mb.zip',
        'index.html',
        'collect.html',
        'others.html',
        'petition.html',
        'timeline.html',
        'login.html',
        'news.html',
        'js/jquery.min.js',
        'js/bootstrap.min.js',
        'js/d3.min.js',
        'js/nvtooltip.js',
        'js/d3legend.js',
        'js/d3line.js',
        'js/d3linewithlegend.js',
        'js/dx.all.js',
        'js/conf.js',
        'js/rally.js',
        'js/collect.js',
        'js/barChart.js',
        'js/donutChart.js',
        'js/lineChart.js',
        'js/tweetParser.js',
        'js/fb-sdk.js',
        'js/login-fb.js',
        'js/login.js',
        'js/petition.js',
        'js/others.js',
        'js/timeline.js',
        'js/news.js',
        'css/bootstrap.min.css',
        'css/font-awesome.min.css',
        'css/custom.css',
        'css/theme.css',
        'css/collect.css',
        'css/lineChart.css',
        'css/timeline.css',
        'css/petition.css',
        'css/news.css',
        'img/achome_beta_brand.png',
        'img/ios.png'
    ];

    // All of these logging statements should be visible via the "Inspect" interface
    // for the relevant SW accessed via chrome://serviceworker-internals
    console.log('Handling install event. Resources to prefetch:', urlsToPrefetch);

    event.waitUntil(
        caches.open(CURRENT_CACHES.prefetch).then(function(cache) {
            var cachePromises = urlsToPrefetch.map(function(urlToPrefetch) {
                // This constructs a new URL object using the service worker's script location as the base
                // for relative URLs.
                var url = new URL(urlToPrefetch, location.href);
                // Append a cache-bust=TIMESTAMP URL parameter to each URL's query string.
                // This is particularly important when precaching resources that are later used in the
                // fetch handler as responses directly, without consulting the network (i.e. cache-first).
                // If we were to get back a response from the HTTP browser cache for this precaching request
                // then that stale response would be used indefinitely, or at least until the next time
                // the service worker script changes triggering the install flow.
                url.search += (url.search ? '&' : '?') + 'cache-bust=' + now;

                // It's very important to use {mode: 'no-cors'} if there is any chance that
                // the resources being fetched are served off of a server that doesn't support
                // CORS (http://en.wikipedia.org/wiki/Cross-origin_resource_sharing).
                // In this example, www.chromium.org doesn't support CORS, and the fetch()
                // would fail if the default mode of 'cors' was used for the fetch() request.
                // The drawback of hardcoding {mode: 'no-cors'} is that the response from all
                // cross-origin hosts will always be opaque
                // (https://slightlyoff.github.io/ServiceWorker/spec/service_worker/index.html#cross-origin-resources)
                // and it is not possible to determine whether an opaque response represents a success or failure
                // (https://github.com/whatwg/fetch/issues/14).
                var request = new Request(url, { mode: 'no-cors' });
                return fetch(request).then(function(response) {
                    if (response.status >= 400) {
                        throw new Error('request for ' + urlToPrefetch +
                            ' failed with status ' + response.statusText);
                    }

                    // Use the original URL without the cache-busting parameter as the key for cache.put().
                    return cache.put(urlToPrefetch, response);
                }).catch(function(error) {
                    console.error('Not caching ' + urlToPrefetch + ' due to ' + error);
                });
            });

            return Promise.all(cachePromises).then(function() {
                console.log('Pre-fetching complete.');
            });
        }).catch(function(error) {
            console.error('Pre-fetching failed:', error);
        })
    );
});

self.addEventListener('activate', function(event) {
    // Delete all caches that aren't named in CURRENT_CACHES.
    // While there is only one cache in this example, the same logic will handle the case where
    // there are multiple versioned caches.
    var expectedCacheNames = Object.keys(CURRENT_CACHES).map(function(key) {
        return CURRENT_CACHES[key];
    });

    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (expectedCacheNames.indexOf(cacheName) === -1) {
                        // If this cache name isn't present in the array of "expected" cache names, then delete it.
                        console.log('Deleting out of date cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', function(event) {
    console.log('Handling fetch event for', event.request.url);

    event.respondWith(
        // caches.match() will look for a cache entry in all of the caches available to the service worker.
        // It's an alternative to first opening a specific named cache and then matching on that.
        caches.match(event.request).then(function(response) {
            if (response) {
                console.log('Found response in cache:', response);

                return response;
            }

            console.log('No response found in cache. About to fetch from network...');

            // event.request will always have the proper mode set ('cors, 'no-cors', etc.) so we don't
            // have to hardcode 'no-cors' like we do when fetch()ing in the install handler.
            return fetch(event.request).then(function(response) {
                console.log('Response from network is:', response);

                return response;
            }).catch(function(error) {
                // This catch() will handle exceptions thrown from the fetch() operation.
                // Note that a HTTP error response (e.g. 404) will NOT trigger an exception.
                // It will return a normal response object that has the appropriate error code set.
                console.error('Fetching failed:', error);

                throw error;
            });
        })
    );
});