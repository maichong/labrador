/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-11-08
 * @author Liang <liang@maichong.it>
 */

import Component from '../component';

declare var __DEV__: bool;

declare type $PropValidator = {
  isRequired: $PropValidator;
  (props: any, propName: string, componentName: string): ?Error;
};

declare type $Node={
  id?: string,
  dataset: {
    [key: string]: string
  }
};

declare type $Touch={
  identifier: number,
  pageX: number,
  pageY: number,
  clientX: number,
  clientY: number
};

declare type $Event = {
  type: string,
  timeStamp: number,
  target: $Node,
  currentTarget: $Node,
  detail: {
    x: number,
    y: number
  },
  touches: Array<$Touch>,
  changedTouches: Array<$Touch>
};

declare type $DataMap = {[key: string]: any};

declare type $ChildConfig = {
  key?: string | number;
  component: Class<Component>;
  props?: $DataMap;
};

declare type $ChildrenConfig = {
  [key: string]: $ChildConfig | Array<$ChildConfig>;
}

declare type $Child = Component | Array<Component>;

declare type $Children = {[key: string]: Component | Array<Component>};

declare interface $Page {
  __route__: string;
  _ready: boolean;
  _show: boolean;
  _loadOptions: Object;
  root: Component;
  page: $Page;
  data: $DataMap;
  setData(data: $DataMap):void;
  updateData(newData: Object):void;
}
