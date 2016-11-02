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
 * @param {boolean} [inList] 是否是list列表中的项目
 */
function Component(props, inList) {
  this._inList = !!inList;
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

  if (__DEBUG__) {
    var original = JSON.parse(JSON.stringify(this.data));
    var append = JSON.parse(JSON.stringify(data));
    this.data = Object.assign({}, this.data, data);
    var changed = JSON.stringify(original) !== JSON.stringify(this.data);
    console.log('%c%s setData(%o) : %o -> %o Component:%o %s',
      'color:#' + (changed ? '2a8f99' : 'bbb'),
      me.id, append, original,
      JSON.parse(JSON.stringify(this.data)),
      me,
      changed ? '' : 'Unchanged'
    );
  } else {
    this.data = Object.assign({}, this.data, data);
  }

  this.parent.setData(this.key, this.data);

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
    me._refs[k].forEach(function (arr) {
      var com = arr[1];
      if (!datas[com.key]) {
        datas[com.key] = {};
      }
      datas[com.key][arr[0]] = data[k];
    });
  });

  Object.keys(datas).forEach(function (k) {
    var com = children[k];
    var d = Object.assign({}, com.props, datas[k]);
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
      if (__DEBUG__) {
        console.log('%c%s onUpdate(%o)', 'color:#2a8f99', com.id, JSON.parse(JSON.stringify(d)));
      }
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

Component.prototype._setKey = function (key, parent) {
  var me = this;
  me.key = key;
  me.parent = parent;
  me.id = parent.id + ':' + key;
  if (key && parent && parent.path) {
    me.path = parent.path + '.' + key;
  } else {
    me.path = key;
  }
  me.name = me.constructor.name || me.path;
};

/**
 * 初始化组件
 * @private
 * @param {string} key
 * @param {Component} parent
 */
Component.prototype._init = function (key, parent) {
  var me = this;
  me._setKey(key, parent);
  //console.log(me.path + '#init', me);
  if (!me.data) {
    me.data = {};
  }

  var children = this.children || null;

  Object.defineProperty(this, 'children', {
    value: children
  });

  var props = Object.assign({}, this.props);

  //初始化props
  if (me._props) {
    Object.keys(me._props).forEach(function (k) {
      var v = me._props[k];
      //console.log('k', '->', k, v);
      if (typeof v === 'string') {
        var refKey = v.substr(1);
        if (v[0] === '@') {
          //绑定父组件的data
          v = parent.data[refKey];
          //console.log('refKey', refKey, v, parent.data);
          parent._registerRef(refKey, k, me);
        } else if (v[0] === '#') {
          v = parent[refKey];
          if (typeof parent[refKey] === 'function') {
            v = function () {
              //绑定父组件的方法
              parent[refKey].apply(parent, arguments);
            };
          } else {
            v = parent[refKey];
          }
        }
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

    //强制更新一遍数据，以便自动检查子组件props引用
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
