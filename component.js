/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-10-08
 * @author Liang <liang@maichong.it>
 */

// @flow

'use strict';

import deepEqual from 'deep-equal';
// $Flow
import _keyBy from 'lodash/keyBy';
import * as utils from './utils';

/**
 * Labrador组件基类
 * @class Component
 */
export default class Component {
  // 默认props
  static defaultProps: $DataMap;
  // 组件props类型定义，必须为static
  static propTypes: { [key: string]: $PropValidator };

  // 组件是否已经初始化
  _inited: boolean;
  // 当前组件在列表中的索引，如果为undefined代表当前组件不在列表中
  _listIndex: number | void;
  // 当前组件在列表中的唯一key，即children()方法返回的配置项key属性，如果为undefined代表当前组件不在列表中
  _listKey: string | number | void;
  // 当前组件的所有子组件KV对
  _children: $Children;
  // children() 方法返回的子控件配置缓存
  _childrenConfigs: $ChildrenConfig;
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
  // setState计时器
  _setStateTimer: number;
  // setState回调函数队列
  _setStateCallbacks: Array<Function>;
  // setState变更列表
  _setStateQueue: Array<$DataMap>;
  // 延迟更新计时器
  _updateTimer: number;

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
    this.props = Object.assign({}, this.constructor.defaultProps, props);
    this._setStateQueue = [];
    this._setStateCallbacks = [];
  }

  /**
   * 设置模板数据
   * @param {object|function} nextState
   * @param {function} [callback]
   */
  setState(nextState: $DataMap, callback?: Function): void {
    if (__DEV__) {
      if (typeof nextState === 'string') {
        console.error(this.id + '#setState() 第一个参数不能为字符串');
      }
    }
    if (!this._inited) {
      console.error(this.id + ' 组件未自动初始化之前请勿调用setState()，如果在组件构造函数中请直接使用"this.state={}"赋值语法');
    }
    this._setStateQueue.push(nextState);
    if (callback) {
      this._setStateCallbacks.push(callback);
    }

    if (this._setStateTimer) return;

    this._setStateTimer = setTimeout(() => {
      this._setStateTimer = 0;
      let state = this.state;
      let stateChanged = false;
      this._setStateQueue.forEach((item) => {
        if (typeof item === 'function') {
          item = item(state, this.props);
        }
        if (!utils.shouldUpdate(state, item)) {
          // 如果没有发生变化，则忽略更新，优化性能
          if (__DEV__) {
            console.log('%c%s setState(%o) ignored',
              'color:#fcc',
              this.id,
              utils.getDebugObject(item)
            );
          }
          return;
        }

        stateChanged = true;

        if (__DEV__) {
          // Development 环境打印state变化
          let original = utils.getDebugObject(state);
          let append = utils.getDebugObject(item);
          state = Object.assign({}, state, item);
          console.log('%c%s setState(%o) : %o -> %o Component:%o',
            'color:#2a8f99',
            this.id, append, original,
            utils.getDebugObject(state),
            this
          );
        } else {
          state = Object.assign({}, state, item);
        }
      });

      this.state = state;
      this._setStateQueue = [];
      this._setStateCallbacks.forEach((fn) => fn());
      this._setStateCallbacks = [];

      if (!stateChanged) return;

      this._update();
    });
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
      if (this.data) {
        console.error(this.id + ' Component data属性和 setData方法已经废弃,请使用state 和 setState代替');
      }
      console.log('%c%s init %o', 'color:#9a23cc', this.id, this);
    }
    // console.log(this.path + '#init', this);
    if (!this.state) {
      this.state = {};
    }
    this._children = {};

    if (__DEV__) {
      this._checkProps();
    }

    if (key && this.onLoad) {
      if (__DEV__) {
        console.log('%c%s onLoad()', 'color:#9a23cc', this.id);
      }
      this.onLoad(this.page._loadOptions);
    }

    if (key && this.page._ready) {
      // 如果 key 不为空，则代表当前组件不是页面根组件
      // 如果 page._ready 则代表页面已经ready，说明当前组件是页面ready后才动态生成的
      utils.callLifecycle(this, 'onReady');
    }

    if (key && this.page._show) {
      utils.callLifecycle(this, 'onShow');
    }

    // 更新页面数据
    this._inited = true;
    this._update();
  }

  /**
   * 初始化时，更新组件的key、id、path等属性
   * @param {string} key         组件key
   * @param {Component} [parent] 父组件
   * @param {number} [listIndex] 组件在列表中的index
   * @param {number} [listKey]   组件在列表中的key定义
   * @private
   */
  _setKey(key: string, parent?: Component, listIndex?: number, listKey?: string | number | void): void {
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
    if (__DEV__ && (key === 'props' || key === 'state')) {
      // $Flow 我们知道parent一定存在，但是Flow不知道
      console.error(`${parent.id} 的子组件'${this.name}'的'key'不能设置为'props'或'state'，请修改 ${parent.id}#children() 方法的返回值`);
    }
  }

  /**
   * 更新组件
   * @private
   */
  _update() {
    if (this._updateTimer) return;
    this._updateTimer = setTimeout(() => {
      this._updateTimer = 0;

      // 内部state数据更新后，自动更新页面数据

      let path = this.path ? this.path + '.' : '';
      let newData = {};
      newData[path + 'props'] = this.props;
      newData[path + 'state'] = this.state;
      this.page.updateData(newData);

      // 更新子组件列表
      this._updateChildren();
    });
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
   * @private
   */
  _updateChildren(): $Children {
    let children = this._children || {};
    let configs = this.children && this.children();
    // 性能优化，当children返回的配置发生变化后才真正更新子控件
    if (!deepEqual(configs, this._childrenConfigs)) {
      if (__DEV__) {
        console.log('%c%s %s -> %o', 'color:#9a23cc', this.id, 'children()', configs);
      }
      // 遍历子组件配置列表
      Object.keys(configs).forEach((key) => {
        let config: $ChildConfig | Array<$ChildConfig> = configs[key];
        if (Array.isArray(config)) {
          // 如果子组件是一个列表
          let map = {};  // 依据列表中每个子组件key生成的原来组件映射
          let used = []; // 存放已知的子组件key，用来检测多个子组件是否重复使用同一个key
          let list: Array<Component> = children[key];
          if (list && Array.isArray(list)) {
            list.forEach((item) => {
              let _listKey = item._listKey;
              if (_listKey || _listKey === 0) {
                map[_listKey] = item;
              }
            });
          }
          list = [];
          config.forEach((c: $ChildConfig, listIndex: number) => {
            if (__DEV__ && c.key === undefined) {
              console.warn(`"${this.name}"的子组件"${key}"列表项必须包含"key"属性定义`);
            }
            let com;
            let childKey = c.key !== null && c.key !== undefined ? String(c.key) : '';
            if (childKey && map.hasOwnProperty(childKey)) {
              if (used.indexOf(childKey) === -1) {
                com = map[childKey];
                delete map[childKey];
              } else if (__DEV__) {
                console.warn(`"${this.name}"的子组件"${key}"列表项必须"key"属性定义发现重复值："${childKey}"`);
              }
              used.push(childKey);
            }
            list.push(this._updateChild(key, com, c, listIndex));
          });

          // 销毁没有用处的子组件
          Object.keys(map).forEach((k) => {
            utils.callLifecycle(map[k], 'onUnload');
          });

          children[key] = { _children: _keyBy(list, com => com._listKey) };
          // 子组件列表更新后，统一更新列表对应的页面数据
          let newData = [];
          list.forEach((com) => {
            newData.push({
              props: com.props,
              state: com.state,
              __k: com._listKey
            });
          });
          let path = this.path ? this.path + '.' + key : key;
          this.page.updateData({
            [path]: newData
          });
        } else {
          // 子组件是单个组件，不是列表
          let component: Component = children[key]; // 原来的组件
          children[key] = this._updateChild(key, component, config);
          if (component) {
            // 如果子组件原来就存在，则更后自动更新页面数据
            let newData = {};
            newData[component.path + '.props'] = component.props;
            newData[component.path + '.state'] = component.state;
            this.page.updateData(newData);
          }
        }
      });
    }
    this._childrenConfigs = configs;
    this._children = children;
    return children;
  }

  /**
   * 更新单个子组件
   * @param {string} key 组件key
   * @param {Component} component
   * @param {Object} config
   * @param {number} listIndex
   * @returns {Component}
   * @private
   */
  _updateChild(key: string, component?: Component, config: $ChildConfig, listIndex?: number): Component {
    if (component) {
      // 找到了原有实例，更新props
      component._setKey(key, this, listIndex, config.key);
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
        component._update();
      }
    } else {
      // 没有找到原有实例，实例化一个新的
      let ComponentClass = config.component;
      component = new ComponentClass(config.props);
      component._config = config;
      component._init(key, this, listIndex, config.key);
    }
    return component;
  }
}

