// ==UserScript==
// @name         Shiki gender sidepanel script
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       Diertz
// @match        https://www.tampermonkey.net/scripts.php?version=4.16.1&ext=dhdg&updated=true
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tampermonkey.net
// @grant        none
// @match        *://shikimori.one/*
// @require  https://gist.github.com/raw/2625891/waitForKeyElements.js
// ==/UserScript==

(function () {
    'use strict';

    let lastPath = null;

    // Since https://shikimori.one/ uses AJAX for navigation the page address changes without reloading.
    // So Tampermonkey doesn't inject script when you navigate from another page on that site and we need to use setInterval.
    setInterval(
        () => {
            if (lastPath !== location.pathname || lastPath === null) {
                lastPath = location.pathname;
                main();
            }
        }
        , 100
    );

    function makeRequest(method, url) {
        return new Promise(function (resolve, reject) {
            const xhr = new XMLHttpRequest();
            xhr.open(method, url);
            xhr.onload = function () {
                if (this.status == 200) {
                    resolve(xhr.response);
                } else {
                    reject({
                        status: this.status,
                        statusText: xhr.statusText
                    });
                }
            };
            xhr.onerror = function () {
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                });
            };
            xhr.send();
        });
    }

    function createSidepanel() {
        const favouritePanel = document.getElementsByClassName("b-favoured")[0];

        const div = document.createElement("div");
        div.classList = "block";
        div.innerHTML = "<div class='subheadline'>Пол</div><div class='block'><div class='b-menu-line'><span>Мужской: </span><span id='b-age-male'>Loading...</span></div><div class='b-menu-line'><span>Женский: </span><span id='b-age-female'>Loading...</span></div><div class='b-menu-line'><span>Не указан: </span><span id='b-age-unknown'>Loading...</span></div></div>";

        favouritePanel.parentElement.insertBefore(div, favouritePanel.nextSibling);
    }

    function incrementElementValue(id) {
        const elem = document.getElementById(id);
        const currentValue = parseInt(elem.innerText);
        elem.innerText = (isNaN(currentValue) ? 0 : currentValue) + 1;
    }

    async function fillSidepanelWithData(url) {
        const favouredURL = url + "/favoured";
        const favouredResponse = await makeRequest("GET", favouredURL);

        const domParser = new DOMParser();
        let tempDocument = domParser.parseFromString(favouredResponse, "text/html");

        const usersWrapper = tempDocument.querySelector("#characters_favoured > section > div:nth-child(1) > div.menu-slide-outer.x199 > div > div > div.block");

        for (const userElement of usersWrapper.children) {
            const userHref = userElement.children[0].href;
            try {
                const userResponse = await makeRequest("GET", userHref);
                tempDocument = domParser.parseFromString(userResponse, "text/html");
                const gender = tempDocument.querySelector(".notice")?.children[0]?.innerText;
                if (gender === "муж") {
                    incrementElementValue("b-age-male");
                } else if (gender === "жен") {
                    incrementElementValue("b-age-female");
                } else {
                    incrementElementValue("b-age-unknown");
                }
            } catch {
                incrementElementValue("b-age-unknown");
            }
        }
    }

    function main() {
        if (window.location.pathname.includes("characters")) {
            createSidepanel();
            fillSidepanelWithData(window.location);
        }
    }
})();
