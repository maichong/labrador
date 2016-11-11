/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-10-11
 * @author Liang <liang@maichong.it>
 */

// @flow

'use strict';

import Component from './component';

module.exports = function createPage(ComponentClass: Class<$Page>) {
  let config = {};
  let root: Component;

  config.data = {};
  config.name = '';

  config._dispatch = function (event: $Event): ?string {
    let com = this;
    let path = event.currentTarget.dataset.path || '';
    let handler = event.currentTarget.dataset['bind' + event.type] || event.currentTarget.dataset['catch' + event.type];
    while (path) {
      let index = path.indexOf('.');
      let key = '';
      if (index === -1) {
        key = path;
        path = '';
      } else {
        key = path.substr(0, index);
        path = path.substr(index + 1);
      }
      com = com._children[key];
      if (!com) {
        console.error('Can not resolve component by path ' + event.currentTarget.dataset.path);
        return undefined;
      }
    }
    if (com[handler]) {
      if (__DEV__) {
        console.log('%c%s %s(%o)', 'color:#2a8f99', com.id, handler, event);
      }
      return com[handler](event);
    }
    console.error('Can not resolve event handle ' + event.currentTarget.dataset.path + '#' + handler);
    return undefined;
  };

  ['onReady', 'onRouteEnd', 'onShow', 'onHide', 'onUnload', 'onPullDownRefreash'].forEach(function (name) {
    config[name] = function () {
      // $FlowFixMe 安全访问证明周期函数
      if (root[name]) {
        return root[name].apply(root.page, arguments);
      }
    };
  });

  config.updateData = function (path: string, state: $DataMap, listIndex?: number) {
    console.log(path, state);
    if (!path) {
      this.setData(state);
    } else {
      path = '_' + path.replace(/\./g, '_');
      this.setData({ [path]: state });
    }
  };

  config.onLoad = function () {
    let me: $Page = this;

    root = new ComponentClass();
    root.page = me;
    me.__proto__.__proto__ = root;
    Object.keys(root).forEach((name) => {
      // $FlowFixMe 安全访问证明周期函数
      me[name] = root[name];
    });

    me.id = me.__route__;
    me.page = me;
    me.props = {};
    me._init('', me);
    if (root.onLoad) {
      root.onLoad.call(me);
    }
  };

  config.onReady = function () {
    this._ready = true;
    if (root.onReady) {
      return root.onReady.apply(root.page, arguments);
    }
  };

  return config;
};
