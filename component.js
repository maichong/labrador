/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-10-08
 * @author Liang <liang@maichong.it>
 */

'use strict';

/**
 * 组件类
 * @class Component
 * @param {object} [data] 组件初始化数据
 */
function Component(data) {
  this._appendData = data;
}

/**
 * 设置模板数据
 * @param {object|string} data
 */
function setData(data) {
  let original = this.parent.data[this.key] || {};
  let res = Object.assign(original);
  for (let i in data) {
    if (data.hasOwnProperty(i)) {
      res[i] = data[i];
    }
  }
  let obj = {};
  obj[this.key] = res;
  this.data = res;
  this.parent.setData(obj);
}

function bindHandlers(page, children) {
  Object.keys(children).forEach(function (key) {
    if (!children.hasOwnProperty(key)) return;
    let component = children[key];
    Object.getOwnPropertyNames(component.constructor.prototype).concat(Object.getOwnPropertyNames(component)).forEach(function (fn) {
      if (fn.substr(0, 6) === 'handle') {
        let name = component.path.replace(/\./g, '_') + '_' + fn;
        page[name] = function () {
          component[fn].apply(component, arguments);
        }
      }
    });
    if (component.children) {
      bindHandlers(page, component.children);
    }
  });
}

/**
 * 初始化组件,此方法不需要手动调用
 * @private
 * @param {string} key
 * @param {Component} parent
 */
Component.prototype.init = function (key, parent) {
  key = key || '';
  parent = parent || null;
  this.key = key;
  this.parent = parent;
  if (parent) {
    this.setData = setData;
  }
  if (key && parent && parent.path) {
    this.path = parent.path + '.' + key;
  } else {
    this.path = key;
  }
  if (!this.data) {
    this.data = {};
  }

  //处理
  if (this._appendData) {
    for (let i in this._appendData) {
      if (this._appendData.hasOwnProperty(i)) {
        this.data[i] = this._appendData[i];
      }
    }
  }

  if (!this.children) {
    this.children = null;
    return;
  }

  for (let k in this.children) {
    if (this.children.hasOwnProperty(k)) {
      let component = this.children[k];
      component.init(k, this);
      this.data[k] = component.data;
    }
  }

  if (!parent) {
    //Top Page
    bindHandlers(this, this.children);
  }

  let onLoad = this.onLoad;

  this.onLoad = function () {
    for (let key in this.children) {
      if (this.children.hasOwnProperty(key)) {
        let com = this.children[key];
        com.parent = this;
        if (com.onLoad) {
          com.onLoad.apply(com, arguments);
        }
      }
    }
    if (onLoad) {
      onLoad.apply(this, arguments);
    }
  };

  const me = this;
  ['onReady', 'onShow', 'onHide', 'onUnload', 'onPullDownRefreash'].forEach(function (name) {
    let func = me[name];
    me[name] = function () {
      for (let key in this.children) {
        let com = this.children[key];
        if (com[name]) {
          com[name].apply(com, arguments);
        }
      }
      if (func) {
        func.apply(this, arguments);
      }
    };
  })
};

module.exports = Component.default = Component;
