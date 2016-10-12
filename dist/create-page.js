/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-10-11
 * @author Liang <liang@maichong.it>
 */

'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function bindHandlers(page, children) {
  Object.keys(children).forEach(function (key) {
    if (!children.hasOwnProperty(key)) return;
    var component = children[key];
    Object.getOwnPropertyNames(component.constructor.prototype).concat(Object.getOwnPropertyNames(component)).forEach(function (name) {
      if (name.substr(0, 6) === 'handle') {
        var refName = component.path.replace(/\./g, '_') + '_' + name;
        page[refName] = function () {
          component[name].apply(component, arguments);
        };
      }
    });
    if (component.children) {
      bindHandlers(page, component.children);
    }
  });
}

module.exports = function createPage(Component) {
  var config = {};

  var t = new Component();
  config.data = t.data || {};
  config.name = Component.name;

  //复制组件定义的原型方法
  Object.getOwnPropertyNames(Component.prototype).forEach(function (name) {
    if (name === 'constructor') return;
    config[name] = Component.prototype[name];
  });

  var onLoad = config.onLoad;

  var getter = Component.prototype.__lookupGetter__('children');
  var children;
  if (!getter) {
    children = t.children;
  }

  config.onLoad = function () {
    var me = this;
    me.onLoad = function () {};
    me.props = {};
    if (getter) {
      children = getter.call(me);
    }

    Object.defineProperty(me, 'children', {
      value: children
    });

    var setData = me.setData;

    var setDataTimer = 0;

    /**
     * 设置模板数据
     * @param {object|string} data
     * @param {object} [value]
     */
    me.setData = function (data, value) {
      if (typeof data === 'string') {
        var tmp = {};
        tmp[data] = value;
        data = tmp;
      }

      var original = me.data;

      me.data = _extends({}, original, data);
      //console.log('Page#setData', original, '+', data, '->', newData);
      if (!setDataTimer) {
        setDataTimer = setTimeout(function () {
          setDataTimer = 0;
          setData.call(me, me.data);
        }, 0);
      }
      if (!children) return;
      //需要用到更新的数据key列表
      var updatedKeys = [];
      Object.keys(data).forEach(function (k) {
        if (me._refs[k]) {
          updatedKeys.push(k);
        }
      });
      //console.log('updatedKeys', updatedKeys, this);
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

      //console.log('datas', datas);
      Object.keys(datas).forEach(function (k) {
        var com = children[k];
        var d = _extends({}, com.props, datas[k]);
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

    if (children) {
      me._refs = {};

      me._registerRef = function (ref, prop, component) {
        if (!me._refs[ref]) {
          me._refs[ref] = [];
        }
        me._refs[ref].push([prop, component]);
      };
      var data = {};
      Object.keys(children).forEach(function (key) {
        var component = children[key];
        component._init(key, me);
        data[key] = component.data;
      });

      //递归绑定子控件事件方法
      bindHandlers(me, children);

      this.setData(data);

      //优化性能
      var existFn = [];
      var allFn = ['onReady', 'onShow', 'onHide', 'onUnload', 'onPullDownRefreash'];
      Object.keys(children).forEach(function (key) {
        var component = children[key];
        if (component.onLoad) {
          component.onLoad();
        }

        allFn.forEach(function (name) {
          if (existFn.indexOf(name) === -1 && component[name]) {
            existFn.push(name);
          }
        });
      });

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

    if (onLoad) {
      onLoad.apply(me, arguments);
    }
  }; //end of onLoad

  return config;
};