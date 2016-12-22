/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-10-11
 * @author Liang <liang@maichong.it>
 */

// @flow

'use strict';

// $Flow
import _set from 'lodash/set';
// $Flow
import _get from 'lodash/get';
import Component from './component';
import * as utils from './utils';

/**
 * 构建列表数据项
 * @param list   原始列表
 * @param item   新列表
 * @returns {{_: *}}
 */
function buildListItem(list: Array<$DataMap>, item: $DataMap): $DataMap {
  if (list && list.length && item.__k !== undefined) {
    for (let t of list) {
      if (t.__k !== undefined && t.__k === item.__k) {
        return Object.assign({}, t, item);
      }
    }
  }
  return item;
}

module.exports = function createPage(ComponentClass: Class<Component>) {
  let config = {};
  let root: Component;
  let page: $Page;

  config.data = {};
  config.name = '';

  config._dispatch = function (event: $Event): ?string {
    let com: $Child = this.root;
    let path = event.currentTarget.dataset.path || '';
    // $Flow
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
      if (Array.isArray(com)) {
        com = com[parseInt(key)];
      } else {
        com = com._children[key];
      }
      if (!com) {
        console.error('Can not resolve component by path ' + event.currentTarget.dataset.path);
        return undefined;
      }
    }
    if (com[handler]) {
      if (__DEV__) {
        // $Flow
        console.log('%c%s %s(%o)', 'color:#2abb40', com.id, handler, event);
      }
      return com[handler](event);
    }
    // $Flow 我们知道com在这里一定是一个组件，而非组件数组，但是Flow不知道
    console.error('Can not resolve event handle ' + com.id + '#' + handler);
    return undefined;
  };

  ['onRouteEnd', 'onUnload', 'onPullDownRefresh', 'onReachBottom', 'onShareAppMessage'].forEach(function (name) {
    config[name] = function (...args) {
      utils.callLifecycle(root, name, args);
    };
  });

  config.onLoad = function (options: Object) {
    page = this;
    page.page = page;
    page._show = false;
    page._ready = false;
    page._loadOptions = options;

    page.updateData = function (newData: Object) {
      // if (__DEV__) {
      //   console.log('%c%s updateData(%o)', 'color:#2a8f99', page.__route__, utils.getDebugObject(newData));
      // }
      let data = page.data;

      Object.keys(newData).forEach((path) => {
        let dataMap = newData[path];
        if (Array.isArray(dataMap)) {
          // 如果是组件列表，需要与之前列表数据合并，这样主要为了在子组件嵌套情况下，不丢失底层子组件数据
          let list = _get(data, path); //原有data中列表数据
          let newList = dataMap.map((item) => buildListItem(list, item));
          _set(data, path, newList);
        } else {
          _set(data, path.split('.'), dataMap);
        }
      });

      page.setData(data);
    };

    page.root = root = new ComponentClass({});
    root._config = {};
    root.page = page;

    root.id = page.__route__;
    root.page = page;
    try {
      root._init('');
    } catch (error) {
      console.error(error.stack);
    }
    if (root.onLoad) {
      root.onLoad(options);
    }
  };

  config.onReady = function () {
    page._ready = true;
    utils.callLifecycle(root, 'onReady');
  };

  config.onShow = function () {
    page._show = true;
    utils.callLifecycle(root, 'onShow');
  };

  config.onHide = function () {
    page._show = false;
    utils.callLifecycle(root, 'onHide');
  };

  return config;
};
