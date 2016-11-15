/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-10-11
 * @author Liang <liang@maichong.it>
 */

// @flow

'use strict';

import _set from 'lodash/set';
import _get from 'lodash/get';
import Component from './component';
//import * as utils from './utils';

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
    console.log('%cdispatch: %s %s %o', 'color:#2abb40', event.type, event.currentTarget.dataset.path, event);
    let com: Component = root;
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
      if (Array.isArray(com)) {
        com = com[key];
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

  config.onLoad = function () {
    page = this;
    page.page = page;

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
    this._ready = true;
    if (root.onReady) {
      return root.onReady.apply(root, arguments);
    }
  };

  return config;
};
