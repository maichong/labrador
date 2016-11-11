/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-10-11
 * @author Liang <liang@maichong.it>
 */

/* eslint no-inner-declarations:0 no-inner-declarations:0 */

// @flow

'use strict';

const numberTag = '[object Number]';
const boolTag = '[object Boolean]';
const stringTag = '[object String]';
const symbolTag = '[object Symbol]';

function isObjectLike(value: any): boolean {
  return value != null && typeof value === 'object';
}

function objectToString(value: Object): string {
  return Object.prototype.toString.call(value);
}

function getType(value: any): string {
  if (Array.isArray(value)) {
    return 'array';
  }

  const type = typeof value;

  if (type === 'function') {
    return 'func';
  }
  if (type === 'number' || (isObjectLike(value) && objectToString(value) === numberTag)) {
    return 'number';
  }
  if (
    value === true || value === false
    || (isObjectLike(value) && objectToString(value) === boolTag)
  ) {
    return 'bool';
  }
  if (type === 'string' || (isObjectLike(value) && objectToString(value) === stringTag)) {
    return 'string';
  }
  if (type === 'object' && value !== null) {
    return 'object';
  }
  if (type === 'symbol' || (isObjectLike(value) && objectToString(value) === symbolTag)) {
    return 'symbol';
  }
  return 'unknown';
}

function generate(name: string, allowNull?: boolean) {
  const validator = function (props: any, propName: string, componentName: string): ?Error {
    const value = props[propName];
    if (value === undefined || (allowNull && value === null)) return null;
    const type = getType(value);
    return type === name ? null : new Error('组件"' + componentName + '"的属性"' + propName + '"类型声明为"' + name + '"，却得到"' + type + '"');
  };
  validator.isRequired = function (props: any, propName: string, componentName: string): ?Error {
    const value = props[propName];
    if (value === undefined || value === null) {
      return new Error('组件"' + componentName + '"的必要属性"' + propName + '"缺失，得到"' + value + '"');
    }
    return validator(props, propName, componentName);
  };
  return validator;
}

const any = function () {
};

if (__DEV__) {
  any.isRequired = function (props: any, propName: string, componentName: string): ?Error {
    const value = props[propName];
    if (value === undefined) {
      return new Error('组件"' + componentName + '"的必要属性"' + propName + '"缺失，得到"' + value + '"');
    }
    return null;
  };

  module.exports = {
    number: generate('number'),
    string: generate('string'),
    func: generate('func', true),
    array: generate('array'),
    bool: generate('bool'),
    object: generate('object', true),
    symbol: generate('symbol'),
    any: any
  };
} else {
  any.isRequired = function () {
  };
  module.exports = {
    number: any,
    string: any,
    func: any,
    array: any,
    bool: any,
    object: any,
    symbol: any,
    any: any
  };
}
