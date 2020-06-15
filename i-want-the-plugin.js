// ==UserScript==
// @name         I Want the Plugin
// @version      0.1.0
// @description  强制启用插件
// @author       Hippo
// @match        https://www.figma.com/file/*
// @connect      www.figma.com
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-start
// ==/UserScript==

(function () {
    const PluginUrlKey = "PluginUrl";
    const InstalledPluginResponseTextKey = "InstalledPluginResponseText";

    function onClickPluginUrlButton() {
        pluginUrl = window.prompt("Plugin URL:");
        console.log("Input plugin url: ", pluginUrl);
        GM_setValue(PluginUrlKey, pluginUrl);
    }

    function addPluginUrlButton() {
        const buttonText = '<button id="pluginUrlButton" type="button"></button>';
        const button = new DOMParser().parseFromString(buttonText, "text/xml").documentElement;
        document.body.appendChild(button);
        document.getElementById("pluginUrlButton").addEventListener("click", onClickPluginUrlButton, false);
        GM_addStyle(`
            #pluginUrlButton {
                position: absolute;
                width: 32px;
                height: 32px;
                bottom: 0px;
                left: 0px;
                z-index: 999;
                background-color: #FFFFFF;
            }
        `);
    }

    function onLoadPlugin(response) {
        if (response.status != 200) {
            onErrorPlugin();
            return;
        }

        const obj = JSON.parse(response.responseText);
        const plugin = obj.meta.plugin;
        const versions = Object.keys(plugin.versions).map((x) => parseInt(x));
        const maxVersion = Math.max(...versions).toString();
        plugin.versions = { [maxVersion]: plugin.versions[maxVersion] };

        const bodyObj = {
            error: false,
            status: 200,
            meta: {
                org: [],
                user: [plugin],
            },
        };
        const bodyText = JSON.stringify(bodyObj);

        GM_setValue(InstalledPluginResponseTextKey, bodyText);
        console.log("Plugin fetched");
    }

    function onErrorPlugin() {
        console.error("Can't get plugin info");
    }

    function updatePlugin() {
        const pluginUrl = GM_getValue(PluginUrlKey, "");
        if (pluginUrl) {
            GM_xmlhttpRequest({
                method: "GET",
                url: pluginUrl,
                onload: onLoadPlugin,
                onerror: onErrorPlugin,
            });
        } else {
            console.log("No plugin url. Please click left bottom corner to input plugin url.");
        }
    }

    function defineProperty(object, name, value) {
        Object.defineProperty(object, name, {
            enumerable: false,
            configurable: false,
            writable: false,
            value: value,
        });
    }

    function replaceResponseText(request, text) {
        try {
            defineProperty(request, "status", 200);
            defineProperty(request, "statusText", "OK");
            defineProperty(request, "response", text);
            defineProperty(request, "responseText", text);
        } catch (e) {
            console.log("error in replaceResponseText:", e);
        }
    }

    function modifyInstalledPlugins(request) {
        const responseText = GM_getValue(InstalledPluginResponseTextKey, "");
        if (responseText) {
            console.log("Plugin loaded");
            replaceResponseText(request, responseText);
        } else {
            console.log("No installed plugin response text, please refresh");
        }
    }

    function onXMLHttpRequestDone(request) {
        if (request.responseURL.startsWith(`https://www.figma.com/api/plugins/installed?`)) {
            modifyInstalledPlugins(request);
        }
    }

    // https://stackoverflow.com/a/51594799
    function modifyXMLHttpRequest(onDone) {
        const _open = XMLHttpRequest.prototype.open;
        window.XMLHttpRequest.prototype.open = function () {
            const _onreadystatechange = this.onreadystatechange;
            const _this = this;

            _this.onreadystatechange = function () {
                if (_this.readyState === 4) {
                    onDone(_this);
                }
                // call original callback
                if (_onreadystatechange) _onreadystatechange.apply(this, arguments);
            };

            // detect any onreadystatechange changing
            Object.defineProperty(this, "onreadystatechange", {
                get: function () {
                    return _onreadystatechange;
                },
            });
            return _open.apply(_this, arguments);
        };
    }

    addPluginUrlButton();
    updatePlugin();
    modifyXMLHttpRequest(onXMLHttpRequestDone);
})();
