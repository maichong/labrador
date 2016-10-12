/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-10-08
 * @author Liang <liang@maichong.it>
 */

'use strict';

/**
 * 组件类
 * @class Component
 * @param {object} [props] 组件props初始数据
 */

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function Component(props) {
  this._props = props || {};
  this._refs = {};
  if (!this.props) {
    this.props = {};
  }
}

/**
 * 设置模板数据
 * @param {object|string} data
 * @param {object} [value]
 */
Component.prototype.setData = function setData(data, value) {
  var me = this;
  if (typeof data === 'string') {
    var tmp = {};
    tmp[data] = value;
    data = tmp;
  }
  var original = this.data;
  var append = {};
  Object.keys(data).forEach(function (key) {
    if (data[key] !== original[key]) {
      append[key] = data[key];
    }
  });
  if (Object.keys(append).length === 0) {
    //console.warn('忽略', this.path, 'setData');
    return;
  }
  var newData = this.data = _extends({}, original, append);
  //console.log(this.path + '#setData', original, '+', data, '->', newData);
  this.parent.setData(this.key, newData);

  var children = this.children;
  if (!children) return;
  var updatedKeys = [];
  Object.keys(data).forEach(function (k) {
    if (me._refs[k]) {
      updatedKeys.push(k);
    }
  });
  if (!updatedKeys.length) return;

  var datas = {};
  updatedKeys.forEach(function (k) {
    me._refs[k].forEach(function (com) {
      if (!datas[com.key]) {
        datas[com.key] = {};
      }
      datas[com.key][k] = data[k];
    });
  });

  Object.keys(datas).forEach(function (k) {
    var com = children[k];
    var d = datas[k];
    if (__DEBUG__ && com.propTypes) {
      Object.keys(datas[k]).forEach(function (propName) {
        var validator = com.propTypes[propName];
        if (typeof validator !== 'function') {
          console.warn('组件"' + com.name + '"的"' + propName + '"属性类型检测器不是一个有效函数');
          return;
        }
        var error = validator(d, propName, com.name);
        if (error) {
          console.warn(error.message);
        }
      });
    }
    if (com.onUpdate) {
      com.onUpdate(d);
    }
    com.props = d;
  });
};

/**
 * 注册引用
 * @private
 * @param {string} ref
 * @param {string} prop
 * @param {Component} component
 * @private
 */
Component.prototype._registerRef = function (ref, prop, component) {
  if (!this._refs[ref]) {
    this._refs[ref] = [];
  }
  this._refs[ref].push([prop, component]);
};

/**
 * 初始化组件
 * @private
 * @param {string} key
 * @param {Component} parent
 */
Component.prototype._init = function (key, parent) {
  var me = this;
  me.key = key;
  me.parent = parent;
  if (key && parent && parent.path) {
    me.path = parent.path + '.' + key;
  } else {
    me.path = key;
  }
  me.name = me.constructor.name || me.path;
  //console.log(me.path + '#init', me);
  if (!me.data) {
    me.data = {};
  }

  var children = this.children || null;

  Object.defineProperty(this, 'children', {
    value: children
  });

  var props = _extends({}, this.props);

  //初始化props
  if (me._props) {
    Object.keys(me._props).forEach(function (k) {
      var v = me._props[k];
      //console.log('k', '->', k, v);
      if (typeof v === 'string' && v[0] === '@') {
        var refKey = v.substr(1);
        v = parent.data[refKey];
        //console.log('refKey', refKey, v, parent.data);
        parent._registerRef(refKey, k, me);
      }
      if (v !== undefined) {
        props[k] = v;
      }
    });
  }

  if (__DEBUG__ && me.propTypes) {
    Object.keys(me.propTypes).forEach(function (propName) {
      var validator = me.propTypes[propName];
      if (typeof validator !== 'function') {
        console.warn('组件"' + me.name + '"的"' + propName + '"属性类型检测器不是一个有效函数');
        return;
      }
      var error = validator(props, propName, me.name);
      if (error) {
        console.warn(error.message);
      }
    });
  }

  if (me.onUpdate) {
    me.props = {};
    me.onUpdate(props);
  }
  me.props = props;

  if (children) {
    //优化性能
    var existFn = [];
    var allFn = ['onLoad', 'onReady', 'onShow', 'onHide', 'onUnload', 'onPullDownRefreash'];

    //var data = {};
    //初始化children
    Object.keys(children).forEach(function (k) {
      var component = children[k];
      component._init(k, me);
      //data[k] = component.data;

      allFn.forEach(function (name) {
        if (existFn.indexOf(name) === -1 && component[name]) {
          existFn.push(name);
        }
      });
    });

    me.setData(this.data);

    existFn.forEach(function (name) {
      var func = me[name];
      me[name] = function () {
        Object.keys(children).forEach(function (k) {
          var component = children[k];
          if (component[name]) {
            component[name].apply(component, arguments);
          }
        });
        if (func) {
          func.apply(this, arguments);
        }
      };
    });
  }
};

module.exports = Component.default = Component;