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

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open('airhorner').then(cache => {
            return cache.addAll([
                    '512Mb.zip',
                    'index.html',
                    'collect.html',
                    'others.html',
                    'petition.html',
                    'timeline.html',
                    'login.html',
                    'js/jquery.min.js',
                    'js/bootstrap.min.js',
                    'js/rally.js',
                    'js/collect.js',
                    'js/donutChart.js',
                    'js/login.js',
                    'js/petition.js',
                    'js/others.js',
                    'js/timeline.js',
                    'css/bootstrap.min.css',
                    'css/font-awesome.min.css',
                    'css/custom.css',
                    'css/theme.css',
                    'css/collect.css',
                    'css/timeline.css'
                    // '/index.html?homescreen=1',
                    // '/?homescreen=1',
                    // '/styles/main.css',
                    // '/scripts/main.min.js',
                ])
                .then(() => self.skipWaiting());
        })
    )
});

self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
    // console.log(event.request.url);
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});