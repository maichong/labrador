/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-09-26
 * @author Liang <liang@maichong.it>
 */

'use strict';

const labrador = module.exports = {};

labrador.createPage = require('./create-page');

const noPromise = {
  some: true
};

function forEach(key) {
  if (noPromise[key] || key.substr(0, 2) == 'on' || /\w+Sync$/.test(key)) {
    if (wx.__lookupGetter__(key)) {
      labrador.__defineGetter__(key, function () {
        return wx[key];
      });
    } else {
      labrador[key] = wx;
    }
    return;
  }

  labrador[key] = function (obj) {
    obj = obj || {};
    return new Promise(function (resolve, reject) {
      obj.success = resolve;
      obj.fail = function (res) {
        if (res && res.errMsg) {
          reject(new Error(res.errMsg))
        } else {
          reject(res);
        }
      };
      wx[key](obj);
    });
  }
}

for (let key in wx) {
  forEach(key);
}
