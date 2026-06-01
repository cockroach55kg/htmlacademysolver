// ==UserScript==
// @name         HTMLAutoma for HTMLAcademy WORKING
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  HTMLAcademy helper loader without @require. Спасибо https://github.com/quyxishi за оригинал -> https://github.com/cockroach55kg доработал
// @match        *://up.htmlacademy.ru/**/module/*
// @grant        GM_xmlhttpRequest
// @connect      raw.githubusercontent.com
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const PREFIX = '[HTMLAutoma]';

    const SRC_URL =
        'https://raw.githubusercontent.com/quyxishi/htmlautoma/main/src/main.js?cacheBust=' +
        Date.now();

    function log(...args) {
        console.log(PREFIX, ...args);
    }

    function warn(...args) {
        console.warn(PREFIX, ...args);
    }

    function error(...args) {
        console.error(PREFIX, ...args);
    }

    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function waitForPageReady() {
        return new Promise(resolve => {
            if (
                document.readyState === 'complete' ||
                document.readyState === 'interactive'
            ) {
                resolve();
                return;
            }

            document.addEventListener('DOMContentLoaded', resolve, { once: true });
        });
    }

    function loadExternalScript() {
        return new Promise((resolve, reject) => {
            log('Загружаю main.js...');

            GM_xmlhttpRequest({
                method: 'GET',
                url: SRC_URL,

                onload: function (response) {
                    log('HTTP status:', response.status);

                    if (response.status < 200 || response.status >= 300) {
                        reject(
                            new Error(
                                'Не удалось загрузить main.js. HTTP status: ' +
                                response.status
                            )
                        );
                        return;
                    }

                    const source = response.responseText;

                    log('main.js загружен. Размер:', source.length, 'символов');

                    try {
                        new Function(source);
                        log('Синтаксис main.js корректный.');
                    } catch (e) {
                        console.log(source);
                        reject(e);
                        return;
                    }

                    try {
                        const script = document.createElement('script');

                        script.textContent =
                            source +
                            '\n\n//# sourceURL=htmlautoma-main-loaded.js';

                        document.documentElement.appendChild(script);
                        script.remove();

                        log('main.js вставлен в страницу.');
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                },

                onerror: function (e) {
                    reject(e);
                },

                ontimeout: function () {
                    reject(new Error('Таймаут загрузки main.js.'));
                }
            });
        });
    }

    async function start() {
        try {
            log('Страница:', location.href);

            await waitForPageReady();

            log('DOM готов. Жду элементы HTMLAcademy...');
            await wait(1500);

            await loadExternalScript();

            await wait(500);

            if (typeof window.main === 'function') {
                log('window.main найден. Запускаю...');
                window.main();
                log('window.main выполнен.');
                return;
            }

            if (typeof main === 'function') {
                log('main найден. Запускаю...');
                main();
                log('main выполнен.');
                return;
            }
            error('main() не найден после загрузки скрипта.');
        } catch (e) {
            error('Ошибка запуска:', e);
        }
    }

    start();
})();
