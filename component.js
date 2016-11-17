/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-10-08
 * @author Liang <liang@maichong.it>
 */

// @flow

'use strict';

import * as utils from './utils';

/**
 * Labrador组件基类
 * @class Component
 */
export default class Component {
  // 组件props类型定义，必须为static
  static propTypes: {[key: string]:$PropValidator};

  // 组件是否已经初始化
  _inited: boolean;
  // 组件已经绑定的生命周期函数map
  _bound: Object;
  // 组件是否已经绑定所有的生命周期函数
  _boundAllLifecycle: boolean;
  // 当前组件在列表中的索引，如果为undefined代表当前组件不在列表中
  _listIndex: number | void;
  // 当前组件在列表中的唯一key，即children()方法返回的配置项key属性，如果为undefined代表当前组件不在列表中
  _listKey: string | void;
  // 当前组件的所有子组件KV对
  _children: $Children;
  // 组件实例化时的参数
  _config: {};

  // 组件ID
  id: string;
  // 组件key，
  key: string;
  // 组件key，不等同于_listKey
  name: string;
  // 组件路径
  path: string;
  // 组件props
  props: $DataMap;
  // 组件内部state
  state: $DataMap;
  // 父组件
  parent: Component | void;
  // 组件所属page对象
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
      console.error(this.id + ' 组件未自动初始化之前请勿调用setState()，如果在组件构造函数中请直接使用"this.state={}"赋值语法');
    }
    if (!utils.shouldUpdate(this.state, nextState)) {
      // 如果没有发生变化，则忽略更新，优化性能
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
      // Development 环境打印state变化
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

    // 内部state数据更新后，自动更新页面数据
    this.page.updateData(this.path, this.state);
    // 更新子组件列表
    this._updateChildren(true);

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
    if (__DEV__) {
      // $Flow
      console.log('%c%s init %o', 'color:#9a23cc', this.id, this);
    }
    // console.log(this.path + '#init', this);
    if (!this.state) {
      this.state = {};
    }
    let __k = listKey || listIndex;
    if (__k !== undefined) {
      // 如果listKey存在，则代表当前组件是在组件列表中
      // 将listKey存储在state.__k中，并自动将此值传值到模板中，用于优化wx:for循环性能
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

    // 绑定生命周期函数
    this._bindLifecycle();

    if (key && this.onLoad) {
      this.onLoad();
    }

    if (key && this.page._ready && this.onReady) {
      // 如果 key 不为空，则代表当前组件不是页面根组件
      // 如果 page._ready 则代表页面已经ready，说明当前组件是页面ready后才动态生成的
      this.onReady();
    }

    // 更新页面数据
    this.page.updateData(this.path, this.state);
    this._inited = true;
  }

  /**
   * 初始化时，更新组件的key、id、path等属性
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
   * 调用组件的children()方法获取子组件列表，如果对应的子组件存在则调用子组件onUpdate更新props，否者自动创建子组件
   * @param {boolean} autoInit  是否自动初始化子组件
   * @private
   */
  _updateChildren(autoInit?: boolean): $Children {
    let children = this._children || {};
    let configs = this.children && this.children();
    if (configs) {
      if (__DEV__) {
        console.log('%c%s %s -> %o', 'color:#9a23cc', this.id, 'children()', configs);
      }
      // 遍历子组件配置列表
      Object.keys(configs).forEach((key) => {
        let config: $ChildConfig | Array<$ChildConfig> = configs[key];
        if (Array.isArray(config)) {
          // 如果子组件是一个列表

          let map = {};  // 依据列表中每个子组件key生成的原来组件隐射
          let used = []; // 存放已知的子组件key，用来检测多个子组件是否重复使用同一个key
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
            if (__DEV__ && c.key === undefined) {
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
              used.push(childKey);
            }
            list.push(this._updateChild(com, c, autoInit));
          });
          children[key] = list;
          // 子组件列表更新后，统一更新列表对应的页面数据
          this.page.updateData(this.path + '.' + key, list.map(com => com.state));
        } else {
          // 子组件是单个组件，不是列表
          let component: Component = children[key]; // 原来的组件
          children[key] = this._updateChild(component, config, autoInit);
          if (component) {
            // 如果子组件原来就存在，则更后自动更新页面数据
            this.page.updateData(component.path, component.state);
          }
        }
      });
    }
    this._children = children;

    if (autoInit) {
      // 则检查子组件是否初始化
      // 因为state变化后，children()方法有可能返回了动态更改过的子组件列表
      Object.keys(children).forEach((k) => {
        let component: $Child = children[k];
        if (Array.isArray(component)) {
          component.forEach((item, index) => item._init(k, this, index, item._config.key));
        } else {
          component._init(k, this);
        }
      });
    }
    return children;
  }

  /**
   * 更新单个子组件
   * @param component
   * @param config
   * @param {boolean} autoInit  是否自动初始化子组件
   * @returns {Component}
   * @private
   */
  _updateChild(component?: Component, config: $ChildConfig, autoInit?: boolean): Component {
    if (component) {
      // 找到了原有实例，更新props
      if (config.props && utils.shouldUpdate(component.props, config.props)) {
        let nextProps;
        if (component.props && component.props.merge && component.props.asMutable) {
          // 如果 props.merge 存在，则代表props是一个Immutable对象
          nextProps = component.props.merge(config.props);
        } else {
          nextProps = Object.assign({}, component.props, config.props);
        }
        if (component.onUpdate) {
          if (__DEV__) {
            // Development
            let original = utils.getDebugObject(component.props);
            component.onUpdate(nextProps);
            console.log('%c%s onUpdate(%o) -> %o Component:%o',
              'color:#2a8f99',
              this.id, original,
              utils.getDebugObject(component.props),
              component
            );
          } else {
            component.onUpdate(nextProps);
          }
        }
        component.props = nextProps;
        component._updateChildren(autoInit);
      }
    } else {
      // 没有找到原有实例，实例化一个新的
      let ComponentClass = config.component;
      component = new ComponentClass(config.props);
      component._config = config;
    }
    return component;
  }

  /**
   * 绑定生命周期函数
   * 用于在组件树中逐层触发生命周期函数
   * @private
   */
  _bindLifecycle() {
    // 如果已经全部绑定过
    if (this._boundAllLifecycle) return;
    let children: $Children = this._updateChildren(false);

    let childrenKeys = Object.keys(children);

    if (!childrenKeys.length) {
      return;
    }
    // 优化性能 只绑定子组件中存在的生命周期函数
    let existFn: Array<string> = [];
    let allFn = ['onReady', 'onRouteEnd', 'onShow', 'onHide', 'onUnload', 'onPullDownRefreash'];

    if (!this._bound) {
      this._bound = {};
    }

    allFn.forEach((name) => {
      // $Flow 安全访问生命周期函数
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
        // 组件列表
        component.forEach((item, index) => {
          item._init(k, this, index, item._config.key);
          allFn.forEach((name) => {
            if (existFn.indexOf(name) === -1 && item[name]) {
              existFn.push(name);
            }
          });
        });
      } else {
        component._init(k, this);
        allFn.forEach((name) => {
          // $Flow 安全访问生命周期函数
          if (existFn.indexOf(name) === -1 && component[name]) {
            existFn.push(name);
          }
        });
      }
    });

    if (!hasEmpayArray) {
      // 如果不存在空数组，则判定所有绑定完成
      // 因为如果存在空数组，列表中的子组件会在稍后动态创建，那么当下是无法知道子组件都存在什么生命周期函数，所以必须随后再次绑定
      this._boundAllLifecycle = true;
    }

    existFn.forEach((name) => {
      if (this._bound[name]) return;
      this._bound[name] = true;
      // $Flow 安全访问生命周期函数
      let func = this[name];
      // $Flow 安全访问生命周期函数
      this[name] = function (...args) {
        Object.keys(this._children).forEach((k) => {
          let component: $Child = this._children[k];
          if (Array.isArray(component)) {
            component.forEach((com) => {
              if (com[name]) {
                com[name].apply(com, args);
              }
            });
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
