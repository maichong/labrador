/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-09-26
 * @author Liang <liang@maichong.it>
 */

'use strict';

import Component from './component';
import PropTypes from './prop-types';
import _createPage from './create-page';

// 特别指定的wx对象中不进行Promise封装的方法
const noPromiseMethods = {
  clearStorage: 1,
  hideToast: 1,
  showNavigationBarLoading: 1,
  hideNavigationBarLoading: 1,
  drawCanvas: 1,
  canvasToTempFilePath: 1,
  hideKeyboard: 1,
};

const labrador = {
  // 原始wx对象
  wx,
  // getApp() 优雅的封装
  get app() {
    return getApp();
  },

  // getCurrentPages() 优雅的封装
  get currentPages() {
    return getCurrentPages();
  }
};

if (__DEV__) {
  Object.defineProperty(labrador, 'Component', {
    get(){
      console.error('labrador 0.6版本之后废弃了 wx.Component，请使用 ' +
        '"import wx, { Component, PropsTypes } from \'labrador\'" 代替 ' +
        '"import wx from \'labrador\'"');
    }
  });
  Object.defineProperty(labrador, 'PropsTypes', {
    get(){
      console.error('labrador 0.6版本之后废弃了 wx.PropsTypes，请使用 ' +
        '"import wx, { Component, PropsTypes } from \'labrador\'" 代替 ' +
        '"import wx from \'labrador\'"');
    }
  });
}

Object.keys(wx).forEach((key) => {
  if (
    noPromiseMethods[key]                        // 特别指定的方法
    || /^(on|create|stop|pause|close)/.test(key) // 以on* create* stop* pause* close* 开头的方法
    || /\w+Sync$/.test(key)                      // 以Sync结尾的方法
  ) {
    // 不进行Promise封装
    labrador[key] = function () {
      if (__DEV__) {
        let res = wx[key].apply(wx, arguments);
        if (!res) {
          res = {};
        }
        if (res && typeof res === 'object') {
          res.then = () => {
            console.warn('wx.' + key + ' is not a async function, you should not use await ');
          };
        }
        return res;
      }
      return wx[key].apply(wx, arguments);
    };
    return;
  }

  // 其余方法自动Promise化
  labrador[key] = function (obj) {
    obj = obj || {};
    return new Promise((resolve, reject) => {
      obj.success = resolve;
      obj.fail = (res) => {
        if (res && res.errMsg) {
          reject(new Error(res.errMsg));
        } else {
          reject(res);
        }
      };
      wx[key](obj);
    });
  };
});

export default labrador;
export { Component, PropTypes, _createPage };
