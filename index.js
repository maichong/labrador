/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-09-26
 * @author Liang <liang@maichong.it>
 */

'use strict';

var labrador = module.exports = {};
labrador.default = labrador;

labrador._createPage = require('./create-page');
labrador.Component = require('./component');
labrador.PropTypes = labrador.Types = require('./prop-types');

Object.defineProperty(labrador, 'app', {
  get: function () {
    return getApp();
  }
});

var noPromise = {
  some: true
};

function forEach(key) {
  if (noPromise[key] || key.substr(0, 2) === 'on' || /\w+Sync$/.test(key)) {
    if (wx.__lookupGetter__(key)) {
      Object.defineProperty(labrador, key, {
        get: function () {
          return wx[key];
        }
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
          reject(new Error(res.errMsg));
        } else {
          reject(res);
        }
      };
      wx[key](obj);
    });
  };
}

Object.keys(wx).forEach(forEach);
