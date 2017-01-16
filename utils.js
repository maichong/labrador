/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-11-04
 * @author Liang <liang@maichong.it>
 */

// @flow

import type Component from './component';

/**
 * 获取用于调试输出的对象
 * @param {Object} object
 * @returns {Object}
 */
export function getDebugObject(object: Object): Object {
  if (__DEV__) {
    if (typeof object !== 'object' || !object || object.asMutable) return object;
    try {
      for (let key in object) {
        if (object[key] && typeof object[key] === 'object' && !object[key].asMutable) return JSON.parse(JSON.stringify(object));
      }
    } catch (e) {
      // 对象中有递归引用，JSON.stringify 会报错
    }
  }
  return object;
}

/**
 * 判断是否需要更新
 * @param {Object} original  原有对象
 * @param {Object} append    新增数据
 * @returns {boolean}
 */
export function shouldUpdate(original: Object, append: Object): boolean {
  if (original === append) return false;
  for (let key in append) {
    let value = append[key];
    if (typeof value === 'object' && value) {
      if (!value.asMutable || original[key] !== value) {
        return true;
      }
    } else if (original[key] !== value) {
      //bool string number null
      return true;
    }
  }
  return false;
}

/**
 * 递归调用组件的生命周期函数
 * @param {Component} component
 * @param {string} name
 * @param {array} [args]
 */
export function callLifecycle(component: Component, name: string, args?: Array<*>) {
  // $Flow 安全访问生命周期函数
  if (component[name]) {
    if (__DEV__) {
      console.log('%c%s %s()', 'color:#9a23cc', component.id, name);
    }
    component[name].apply(component, args);
  }

  if (component._children) {
    for (let key in component._children) {
      let child: $Child = component._children[key];
      if (Array.isArray(child)) {
        child.forEach(item => callLifecycle(item, name, args));
      } else {
        callLifecycle(child, name, args);
      }
    }
  }
}
