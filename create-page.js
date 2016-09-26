/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-09-24
 * @author Liang <liang@maichong.it>
 */

'use strict';

function setData(value) {
    let data = this.page.data[this.key] || {};
    let res = Object.assign(data);
    for (let i in value) {
        res[i] = value[i];
    }
    let obj = {};
    obj[this.key] = res;
    this.page.setData(obj);
}

module.exports = function CreatePage(config) {
    if (!config.data) {
        config.data = {};
    }
    if (config.components) {
        let onLoad = config.onLoad;
        config.onLoad = function () {
            for (let key in config.components) {
                let com = config.components[key];
                com.setData = setData;
                com.key = key;
                com.page = this;
                if (com.data) {
                    com.setData(com.data);
                }
                if (com.onLoad) {
                    com.onLoad.apply(com, arguments);
                }
            }
            if (onLoad) {
                onLoad.call(this, arguments);
            }
        };

        ['onReady', 'onShow', 'onHide', 'onUnload'].forEach(function (name) {
            let func = config[name];
            config[name] = function () {
                for (let key in this.components) {
                    let com = this.components[key];
                    if (com[name]) {
                        com[name].apply(com, arguments);
                    }
                }
                if (func) {
                    func.apply(this, arguments);
                }
            };
        })
    }

    return Page(config);

};