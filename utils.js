/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-11-04
 * @author Liang <liang@maichong.it>
 */

// @flow

export function getDebugObject(object: Object): Object {
  if (__DEV__) {
    if (typeof object !== 'object' || !object || object.asMutable) return object;
    for (let key in object) {
      if (object[key] && typeof object[key] === 'object' && !object[key].asMutable) return JSON.parse(JSON.stringify(object));
    }
  }
  return object;
}

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
