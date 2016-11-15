/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-10-08
 * @author Liang <liang@maichong.it>
 */

// @flow

'use strict';

import * as utils from './utils';

/**
 * 组件类
 * @class Component
 */
export default class Component {
  static propTypes: {[key: string]:$PropValidator};

  _inited: boolean;
  _boundAllLifecycle: boolean;
  _bound: Object;
  _listIndex: number | void;
  _listKey: string | void;
  _children: $Children;
  _config: {};

  id: string;
  key: string;
  name: string;
  path: string;
  props: $DataMap;
  state: $DataMap;
  parent: Component;
  page: $Page;

  onLoad: Function;
  onReady: Function;
  onShow: Function;
  onHide: Function;
  onUnload: Function;
  onPullDownRefreash: Function;
  onUpdate: Function;
  children: Function;

  /**
   * @param {object} [props] 组件props初始数据
   */
  constructor(props?: $DataMap) {
    this.props = props || {};
    this._bound = {};
  }

  /**
   * 设置模板数据
   * @param {object|string} nextState
   */
  setState(nextState: $DataMap): void {
    if (!this._inited) {
      console.error(this.id + ' 组件未自动初始化之前请勿调用setState()');
    }
    if (!utils.shouldUpdate(this.state, nextState)) {
      //如果没有发生变化，则忽略更新，优化性能
      if (__DEV__) {
        console.log('%c%s setState(%o) ignored',
          'color:#fcc',
          this.id,
          utils.getDebugObject(nextState)
        );
      }
      return;
    }

    if (__DEV__) {
      //Development 环境打印state变化
      let original = utils.getDebugObject(this.state);
      let append = utils.getDebugObject(nextState);
      this.state = Object.assign({}, this.state, nextState);
      let changed = JSON.stringify(original) !== JSON.stringify(this.state);
      console.log('%c%s setState(%o) : %o -> %o Component:%o %s',
        'color:#' + (changed ? '2a8f99' : 'bbb'),
        this.id, append, original,
        utils.getDebugObject(this.state),
        this,
        changed ? '' : 'Unchanged'
      );
    } else {
      this.state = Object.assign({}, this.state, nextState);
    }

    this.page.updateData(this.path, this.state);
    let children = this._updateChildren();

    //如果当前组件已经初始化，则检查子组件是否初始化
    Object.keys(children).forEach((k) => {
      let component: $Child = children[k];
      if (Array.isArray(component)) {
        component.forEach((item, index) => item._init(k, this, index, item._config.key));
      } else {
        component._init(k, this);
      }
    });
  }

  /**
   * @param {string} key         组件key
   * @param {Component} [parent] 父组件
   * @param {number} [listIndex] 组件在列表中的index
   * @param {number} [listKey]   组件在列表中的key定义
   * @private
   */
  _setKey(key: string, parent?: Component, listIndex?: number, listKey?: string): void {
    this.key = key;
    this._listIndex = listIndex;
    this._listKey = listKey;
    if (parent) {
      this.page = parent.page;
      this.id = parent.id + ':' + key;
    }
    this.parent = parent;
    if (key && parent && parent.path) {
      this.path = parent.path + '.' + key;
    } else {
      this.path = key;
    }
    if (typeof listIndex === 'number') {
      this.path += '.' + listIndex;
      this.id += '.' + listIndex;
    }
    this.name = this.constructor.name || this.path;
  }

  /**
   * 初始化组件
   * @private
   * @param {string} key         组件key
   * @param {Component} [parent] 父组件
   * @param {number} [listIndex] 组件在列表中的index
   * @param {number} [listKey]   组件在列表中的key定义
   */
  _init(key: string, parent?: Component, listIndex?: number, listKey?: string): void {
    if (this._inited) return;
    this._setKey(key, parent, listIndex, listKey);
    //console.log(this.path + '#init', this);
    if (!this.state) {
      this.state = {};
    }
    let __k = listKey || listIndex;
    if (__k !== undefined) {
      if (this.state.asMutable) {
        this.state = this.state.set('__k', __k);
      } else {
        this.state.__k = __k;
      }
    }
    this._children = {};

    if (__DEV__) {
      this._checkProps();
    }

    this._bindLifecycle();

    if (key && this.onLoad) {
      this.onLoad();
    }
    if (key && this.page._ready && this.onReady) {
      this.onReady();
    }

    this.page.updateData(this.path, this.state);
    this._inited = true;
  }

  /**
   * Development环境下检查propsTypes属性设置
   * @private
   */
  _checkProps() {
    if (__DEV__ && this.propsTypes) {
      console.warn('组件"' + this.name + '"的"propsTypes"属性应该为静态static');
    }

    if (__DEV__ && this.constructor.propTypes) {
      Object.keys(this.constructor.propTypes).forEach((propName) => {
        let validator = this.constructor.propTypes[propName];
        if (typeof validator !== 'function') {
          console.warn('组件"' + this.name + '"的"' + propName + '"属性类型检测器不是一个有效函数');
          return;
        }
        let error = validator(this.props, propName, this.name);
        if (error) {
          console.warn(error.message);
        }
      });
    }
  }

  /**
   * 更新所有子控件，负责实例化子控件以及更新其props
   * @private
   */
  _updateChildren(): $Children {
    let children = this._children || {};
    let configs = this.children && this.children();
    if (configs) {
      if (__DEV__) {
        console.log('%c%s %s -> %o', 'color:#9a23cc', this.id, 'children()', configs);
      }
      Object.keys(configs).forEach((key) => {
        let config: $ChildConfig | Array<$ChildConfig> = configs[key];
        if (Array.isArray(config)) {
          let map = {};
          let used = [];
          let list: Array<Component> = children[key];
          if (list && Array.isArray(list)) {
            list.forEach((item) => {
              if (item._listKey) {
                map[item._listKey] = item;
              }
            });
          }
          list = [];
          config.forEach((c: $ChildConfig) => {
            if (__DEV__ && !c.key) {
              console.warn(`"${this.name}"的子组件"${key}"列表项必须包含"key"属性定义`);
            }
            let com;
            let childKey = c.key !== null && c.key !== undefined ? String(c.key) : '';
            if (childKey && map.hasOwnProperty(childKey)) {
              if (used.indexOf(childKey) === -1) {
                com = map[childKey];
              } else if (__DEV__) {
                console.warn(`"${this.name}"的子组件"${key}"列表项必须"key"属性定义发现重复值："${childKey}"`);
              }
            }
            list.push(this._updateChild(com, c));
          });
          children[key] = list;
          this.page.updateData(this.path + '.' + key, list.map(com => com.state));
        } else {
          let component: $Child = children[key]; //原来的组件
          if (!Array.isArray(component)) { //我们知道此处original不会为数组，但flow不知道
            children[key] = this._updateChild(component, config);
          }
        }
      });
    }
    this._children = children;
    return children;
  }

  /**
   * 更新单个子组件
   * @param component
   * @param config
   * @returns {Component}
   * @private
   */
  _updateChild(component?: Component, config: $ChildConfig): Component {
    if (component) {
      //找到了原有实例，更新props
      if (config.props && utils.shouldUpdate(component.props, config.props)) {
        if (component.onUpdate) {
          component.onUpdate(config.props);
        }
        component.props = config.props;
      }
    } else {
      //没有找到原有实例，实例化一个新的
      let ComponentClass = config.component;
      component = new ComponentClass(config.props);
      component._config = config;
    }
    return component;
  }

  /**
   * 绑定生命周期函数
   * @private
   */
  _bindLifecycle() {
    if (this._boundAllLifecycle) return;
    let children: $Children = this._updateChildren();

    let childrenKeys = Object.keys(children);

    if (!childrenKeys.length) {
      return;
    }
    //优化性能
    let existFn: Array<string> = [];
    let allFn = ['onReady', 'onRouteEnd', 'onShow', 'onHide', 'onUnload', 'onPullDownRefreash'];

    if (!this._bound) {
      this._bound = {};
    }

    allFn.forEach((name) => {
      // $FlowFixMe 安全访问证明周期函数
      if (this[name] && !this._bound[name]) {
        existFn.push(name);
      }
    });

    let hasEmpayArray = false;

    childrenKeys.forEach((k) => {
      let component: $Child = children[k];
      if (Array.isArray(component)) {
        if (!component.length) {
          hasEmpayArray = true;
        }
        //组件列表
        component.forEach((item, index) => {
          item._init(k, this, index, item._config.key);
          allFn.forEach((name) => {
            // $FlowFixMe 安全访问证明周期函数
            if (existFn.indexOf(name) === -1 && item[name]) {
              existFn.push(name);
            }
          });
        });
      } else {
        component._init(k, this);
        allFn.forEach((name) => {
          // $FlowFixMe 安全访问证明周期函数
          if (existFn.indexOf(name) === -1 && component[name]) {
            existFn.push(name);
          }
        });
      }
    });

    if (!hasEmpayArray) {
      this._boundAllLifecycle = true;
    }

    existFn.forEach((name) => {
      if (this._bound[name]) return;
      this._bound[name] = true;
      // $FlowFixMe 安全访问证明周期函数
      let func = this[name];
      // $FlowFixMe 安全访问证明周期函数
      this[name] = function (...args) {
        Object.keys(this._children).forEach((k) => {
          let component: $Child = this._children[k];
          if (Array.isArray(component)) {
            component.forEach((com) => {
              // $FlowFixMe 安全访问证明周期函数
              if (com[name]) {
                com[name].apply(com, args);
              }
            });
            // $FlowFixMe 安全访问证明周期函数
          } else if (component[name]) {
            component[name].apply(component, args);
          }
        });
        if (func) {
          func.apply(this, args);
        }
      };
    });
  }
}
