/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-09-26
 * @author Liang <liang@maichong.it>
 */

'use strict';

import Component from './component';
import PropTypes from './prop-types';
import _createPage from './create-page';

const noPromiseMethods = {
  stopRecord: true,
  pauseVoice: true,
  stopVoice: true,
  pauseBackgroundAudio: true,
  stopBackgroundAudio: true,
  showNavigationBarLoading: true,
  hideNavigationBarLoading: true,
  createAnimation: true,
  createContext: true,
  hideKeyboard: true,
  stopPullDownRefresh: true
};

const labrador = {
  wx,
  get app() {
    return getApp();
  }
};

function forEach(key) {
  if (noPromiseMethods[key] || key.substr(0, 2) === 'on' || /\w+Sync$/.test(key)) {
    labrador[key] = function () {
      if (__DEV__) {
        let res = wx[key].apply(wx, arguments);
        if (!res) {
          res = {};
        }
        if (res && typeof res === 'object') {
          res.then = function () {
            console.warn('wx.' + key + ' is not a async function, you should not use await ');
          };
        }
        return res;
      }
      return wx[key].apply(wx, arguments);
    };
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

export default labrador;
export { Component, PropTypes, _createPage };
