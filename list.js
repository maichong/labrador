/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-10-16
 * @author Liang <liang@maichong.it>
 */

function List(Component, ref, map) {
  this.data = [];
  this.Component = Component;
  this._refKey = ref;
  this.map = map;
  this.props = {};
  var me = this;
  this._refs = {};

  //检查子组件存在的生命周期函数
  //注意：如果子组件的子组件有某个生命周期函数，那么子组件中也应当有对应的显式声明，哪怕是空函数，否者子组件的子组件不会被调用
  ['onLoad', 'onReady', 'onShow', 'onHide', 'onUnload', 'onPullDownRefreash'].forEach(function (name) {
    if (Component.prototype[name]) {
      me[name] = function () {
        me['_' + name] = true;
        var args = arguments;
        me.children.forEach(function (child) {
          child[name].apply(child, args);
        });
      };
    }
  });
}

List.prototype.setData = function setData(key, data) {
  this.data[key] = data;
  this.parent.setData(this.key, this.data);
};

List.prototype._init = function init(key, parent) {
  var me = this;
  me.key = key;
  me.parent = parent;
  me.id = parent.id + ':' + key;
  if (key && parent && parent.path) {
    me.path = parent.path + '.' + key;
  } else {
    me.path = key;
  }
  me.name = me.constructor.name || me.path;
  me.children = [];

  parent._registerRef(me._refKey, 'items', me);
};

List.prototype._createItem = function (key, item) {
  var me = this;
  var parent = me.parent;
  var props = {};
  var component = null;
  if (__DEBUG__) {
    console.log('%c%s create item key: %s item: %o', 'color:#2a8f99', me.id, key, JSON.parse(JSON.stringify(item)));
  }
  for (var k in this.map) {
    var value = this.map[k];
    if (typeof value === 'string') {
      var refKey = value.substr(1);
      if (value[0] === '>') {
        value = item[refKey];
        me._refs[refKey] = k;
      } else if (value[0] === '#') {
        value = parent[refKey];
        if (typeof value === 'function') {
          value = function () {
            parent[refKey].apply(parent, [component].concat(Array.prototype.slice.call(arguments)));
          };
        }
      }
    }
    props[k] = value;
  }
  props._item = item;
  component = new me.Component(props, true);
  component._init(key, me);
  if (me._onLoad && component.onLoad) {
    component.onLoad();
  }
  if (me._onReady && component.onReady) {
    component.onReady();
  }
  return component;
};

List.prototype.onUpdate = function (props) {
  var originalChildren = this.children;
  var children = [];
  var data = [];

  function findChildForItem(item) {
    for (var i in originalChildren) {
      if (originalChildren[i].props._item === item) {
        return originalChildren.splice(i, 1)[0];
      }
    }
  }

  for (var i in props.items) {
    var item = props.items[i];
    var child = findChildForItem(item);
    if (!child) {
      child = this._createItem(i, item);
    } else if (child.onUpdate) {
      var newProps = {};
      for (var refKey in this._refs) {
        /**
         * refKey 为对应引用item的key
         * k 为子控件props对应的key
         */
        var k = this._refs[refKey];
        if (item[refKey] !== child.props[k]) {
          newProps[k] = item[refKey];
        }
      }
      if (Object.keys(newProps).length) {
        newProps = Object.assign({}, child.props, newProps);
        if (__DEBUG__) {
          console.log('%c%s onUpdate(%o)', 'color:#2a8f99', child.id, JSON.parse(JSON.stringify(newProps)));
        }
        child.onUpdate(newProps);
      }
    }
    if (i != child.key) {
      child._setKey(i, this);
    }
    children.push(child);
    data.push(child.data);
  }
  this.children = children;
  this.data = data;
  this.parent.setData(this.key, data);

  //销毁不再需要的子组件
  originalChildren.forEach(function (c) {
    if (c.onUnload) {
      c.onUnload();
    }
  });
};

module.exports = List;
