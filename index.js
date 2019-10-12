(function(global, factory) {
    // UMD 加载方案
    if (typeof exports === "object" && typeof module !== "undefined") {
        module.exports = factory();
        return;
    }
    if (typeof global.define === "function" && global.define.amd) {
        global.define(factory);
        return;
    }
    global.storeFn = factory();
})(window, function() {
    "use strict";
    var soleTime = new Date().getTime() - 1000000;
    var soleCount = 1000;
    /**
     * 获取页面唯一的值
     * @returns {string}
     */
    function getOne() {
        soleCount;
        soleCount += 1;
        return Number(Math.round((Math.random() + 1) * 1000000) + (new Date().getTime() - soleTime) + "" + soleCount).toString(36);
    }

    // 本地存储引用
    var LS = window.localStorage;
    var SS = window.sessionStorage;

    // 测试本地存储是否可以用
    var canLS = true;
    try {
        LS.setItem("ls_can", "1");
        if (LS.getItem("ls_can") != "1") {
            canLS = false;
        }
    } catch (e) {
        canLS = false;
    }

    if (!canLS) {
        // 无本地存储，模拟本地实现
        // 数据存储本地，无法长期存储
        // 缓解无痕模式无法存储的问题
        var LSStore = {};
        LS = {
            getItem(key) {
                return LSStore[key];
            },
            setItem(key, val) {
                LSStore[key] = val;
            },
            removeItem(key) {
                try {
                    delete LSStore[key];
                } catch (e) {}
            }
        };
        var SSStore = {};
        SS = {
            getItem(key) {
                return SSStore[key];
            },
            setItem(key, val) {
                SSStore[key] = val;
            }
        };
    }

    var sKeyKey = ":store-s-key";
    var sKey = SS.getItem(sKeyKey);
    if (!sKey) {
        sKey = getOne();
        SS.setItem(sKeyKey, sKey);
    }

    function remove(key) {
        LS.removeItem(key);
        return null;
    }

    function LSClass(pre) {
        this.preposition = pre || ":";
    }
    /**
     * 获取本地存储
     * @param {String} key
     */
    LSClass.prototype.getItem = function(key) {
        key = this.preposition + key;
        var value = LS.getItem(key);
        var json = null;
        try {
            json = JSON.parse(value);
        } catch (e) {}
        if (!json) {
            // 非
            return null;
        }

        // 检测是否过期
        var expiration = json.koi_expiration;
        var isOut = false;
        if (expiration) {
            var now = new Date().getTime();
            if (expiration !== -1 && now > expiration) {
                // 过期
                isOut = true;
            }
        }
        var session = json.koi_session;
        if (session && session != sKey) {
            // 过期
            isOut = true;
        }
        if (isOut) {
            remove(key);
            return null;
        }
        return json.item;
    };

    /**
     * 设置本地存储
     * @param {String} key
     * @param {*} value
     * @param {Number|String|Date} expiration 0:进程，-1:永久，数字:天数，字符串，日期
     */

    LSClass.prototype.setItem = function(key, value, expiration) {
        key = this.preposition + key;
        var json = { item: value };
        if (expiration === undefined) {
            expiration = 0;
        }
        var type = typeof expiration;
        if (type === "number") {
            if (expiration === 0) {
                json.koi_session = sKey;
            } else if (expiration === -1) {
                json.koi_expiration = -1;
            } else {
                json.koi_expiration = new Date().getTime() + expiration * 24 * 60 * 60 * 1000;
            }
        } else {
            // 过期时间 设置为 固定时间
            if (type === "string") {
                expiration = new Date(
                    expiration
                        .replace(/\-/g, "/")
                        .replace(/T/, " ")
                        .replace(/\.\d*$/, "")
                );
            }
            json.koi_expiration = expiration.getTime();
        }
        LS.setItem(key, JSON.stringify(json));
    };

    /**
     * 移除数据
     * @param {String} key
     */
    LSClass.prototype.removeItem = function(key) {
        key = this.preposition + key;
        remove(key);
    };

    var ls = new LSClass(":");
    ls.LSStore = LSClass;

    return ls;
});
