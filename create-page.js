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
  let res = { _: item };
  if (list && list.length && item.__k !== undefined) {
    for (let t of list) {
      if (t._ && t._.__k === item.__k) {
        return Object.assign({}, t, res);
      }
    }
  }
  return res;
}

module.exports = function createPage(ComponentClass: Class<Component>) {
  let config = {};
  let root: Component;
  let page: $Page;

  config.data = {};
  config.name = '';

  config._dispatch = function (event: $Event): ?string {
    let com: $Child = root;
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
    console.error('Can not resolve event handle ' + com.id + '#' + handler);
    return undefined;
  };

  ['onRouteEnd', 'onUnload', 'onPullDownRefresh', 'onReachBottom'].forEach(function (name) {
    config[name] = function (...args) {
      utils.callLifecycle(root, name, args);
    };
  });

  config.onLoad = function () {
    page = this;
    page.page = page;
    page._show = false;
    page._ready = false;

    page.updateData = function (path: string, state: $DataMap | Array<$DataMap>) {
      //console.log('updateData', path, state);
      if (!path) {
        page.setData({ _: state });
      } else {
        let data = page.data;
        if (Array.isArray(state)) {
          let list = _get(data, path); //原有data中列表数据
          let newList = state.map((item) => buildListItem(list, item));
          _set(data, path, newList);
        } else {
          path += '._';
          _set(data, path.split('.'), state);
        }
        page.setData(data);
        //console.log(utils.getDebugObject(page.data));
      }
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
      root.onLoad();
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
