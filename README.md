
#[Labrador](https://github.com/maichong/labrador)

微信小程序组件化开发框架

> QQ交流群 282140496

## 特性
* 使用Labrador框架可以使微信开发者工具支持加载海量NPM包
* 支持ES6/7标准代码，使用async/await能够有效避免回调地狱
* 组件重用，对微信小程序框架进行了二次封装，实现了组件重用和嵌套
* 自动化测试，非常容易编写单元测试脚本，不经任何额外配置即可自动化测试
* 使用Editor Config及ESLint标准化代码风格，方便团队协作
* 强力压缩代码，尽可能减小程序体积，让你在1M的限制内做更多的事

## 安装

首先您的系统中安装Node.js和npm v3 [下载Node.js](https://nodejs.org/en/)，然后运行下面的命令将全局安装Labrador命令行工具。

```
npm install -g labrador-cli
```

## 初始化项目

```
mkdir demo           # 新建目录
cd demo              # 跳转目录
npm init             # 初始化npm包
labrador init        # 初始化labrador项目
```

## 项目目录结构

```sh
demo                 # 项目根目录
├── .labrador        # Labrador项目配置文件
├── .babelrc         # babel配置文件
├── .editorconfig    # Editor Config
├── .eslintignore    # ESLint 忽略配置
├── .eslintrc        # ESLint 语法检查配置
├── package.json
├── dist/            # 目标目录
├── node_modules/
└── src/             # 源码目录
    ├── app.js
    ├── app.json
    ├── app.less
    ├── components/  # 通用组件目录
    ├── pages/       # 页面目录
    └── utils/

```

> **注意** dist目录中的所有文件是由labrador命令编译生成，请勿直接修改

## 配置开发工具

项目初始化后使用WebStorm或Sublime等你习惯的IDE打开项目根目录。然后打开 *微信web开发者工具* 新建项目，本地开发目录选择 `dist` 目标目录。

## 开发流程

在WebStorm或Sublime等IDE中编辑 `src` 目录下的源码，然后在项目根目录中运行`labrador build` 命令构建项目，然后在 *微信web开发者工具* 的调试界面中点击左侧菜单的 *重启* 按钮即可查看效果。

我们在开发中， *微信web开发者工具* 仅仅用来做调试和预览，不要在 *微信web开发者工具* 的编辑界面修改代码。

> *微信web开发者工具* 会偶尔出错，表现为点击 *重启* 按钮没有反应，调试控制台输出大量的无法require文件的错误，*编辑* 界面中代码文件不显示。这是因为 `labrador build` 命令会更新整个 `dist` 目录，而 *微信web开发者工具* 在监测代码改变时会出现异常，遇到这种情况只需要关掉 *微信web开发者工具* 再启动即可。 

我们还可以使用 `labrador watch` 命令来监控 `src` 目录下的代码，当发生改变后自动构建，不用每一次编辑代码后手动运行 `labrador build` 。

所以最佳的姿势是：

1. 在项目中运行 `labrador watch`
2. 在WebStorm中编码，保存
3. 切换到 *微信web开发者工具* 中调试、预览
4. 再回到WebStorm中编码
5. ...

## labrador 命令

#### labrador init 初始化项目命令

注意此命令会初始化当前的目录为项目目录。

#### labrador build 构建当前项目

```
  Usage: labrador build [options]

  Options:

    -h, --help     output usage information
    -V, --version  output the version number
    -c, --catch    在载入时自动catch所有JS脚本的错误
    -t, --test     运行测试脚本
    -d, --debug    DEBUG模式
    -m, --minify   压缩代码
    -f, --force    强制构建，不使用缓存
```

#### labrador watch 监测文件变化

```
  Usage: labrador watch [options]

  Options:

    -h, --help     output usage information
    -V, --version  output the version number
    -c, --catch    在载入时自动catch所有JS脚本的错误
    -t, --test     运行测试脚本
    -d, --debug    DEBUG模式
```

## labrador 库

`labrador` 库对全局的 `wx` 变量进行了封装，将大部分 `wx` 对象中的方法进行了Promise支持， 除了以 `on*` 开头或以 `*Sync` 结尾的方法。在如下代码中使用 `labrador` 库。

```js
import wx from 'labrador';

console.log(wx.version);

wx.app;         // 和全局的 getApp() 函数效果一样，代码风格不建议粗暴地访问全局对象和方法
wx.Component;   // Labrador 自定义组件基类
wx.List;        // Labrador 自定义组件列表类
wx.PropTypes;   // Labrador 数据类型校验器集合

wx.login;       // 封装后的微信登录接口
wx.getStorage;  // 封装后的读取缓存接口
//... 更多请参见 https://mp.weixin.qq.com/debug/wxadoc/dev/api/
```

我们建议不要再使用 `wx.getStorageSync()` 等同步阻塞方法，而在 `async` 函数中使用 `await wx.getStorage()` 异步非阻塞方法提高性能，除非遇到特殊情况。

## app.js

`src/app.js` 示例代码如下：

```js
import wx from 'labrador';
import {sleep} from './utils/util';

export default class {
  globalData = {
    userInfo: null
  };

  async onLaunch() {
    //调用API从本地缓存中获取数据
    let res = await wx.getStorage({ key: 'logs' });
    let logs = res.data || [];
    logs.unshift(Date.now());
    await wx.setStorage({ key: 'logs', data: logs });
    this.timer();
  }

  async timer() {
    while (true) {
      console.log('hello');
      await sleep(10000);
    }
  }

  async getUserInfo() {
    if (this.globalData.userInfo) {
      return this.globalData.userInfo;
    }
    await wx.login();
    let res = await wx.getUserInfo();
    this.globalData.userInfo = res.userInfo;
    return res.userInfo;
  }
}
```

代码中全部使用ES6/7标准语法。代码不必声明 `use strict` ，因为在编译时，所有代码都会强制使用严格模式。

代码中并未调用全局的 `App()` 方法，而是使用 `export` 语法默认导出了一个类，在编译后，Labrador会自动增加 `App()` 方法调用，所有请勿手动调用 `App()` 方法。这样做是因为代码风格不建议粗暴地访问全局对象和方法。

## 自定义组件

Labrador的自定义组件，是基于微信小程序框架的组件之上，进一步自定义组合，拥有逻辑处理和样式。这样做的目的请参见 [微信小程序开发三宗罪和解决方案](https://segmentfault.com/a/1190000007017985)

项目中通用自定义组件存放在 `src/compontents` 目录，一个组件一般由三个文件组成，`*.js` 、 `*.xml` 和 `*.less` 分别对应微信小程序框架的 `js` 、 `wxml` 和 `wxss` 文件。在Labardor项目源码中，我们特意采用了 `xml` 和 `less` 后缀以示区别。如果组件包含单元测试，那么在组件目录下会存在一个 `*.test.js` 的测试脚本文件。

#### 自定义组件示例

下面是一个简单的自定义组件代码实例：

##### 逻辑 `src/compontents/title/title.js`

```js
import wx from 'labrador';
import randomColor  from '../../utils/random-color';

const { string } = wx.PropTypes;

export default class Title extends wx.Component {

  propTypes = {
    text: string
  };

  props = {
    text: ''
  };

  data = {
    text: '',
    color: randomColor()
  };

  onUpdate(props) {
    this.setData('text', props.text);
  }

  handleTap() {
    this.setData({
      color: randomColor()
    });
  }
}

```

自定义组件的逻辑代码和微信框架中的page很相似，最大的区别是在js逻辑代码中，没有调用全局的 `Page()` 函数声明页面，而是用 `export` 语法导出了一个默认的类，这个类必须继承于 `labrador.Component` 组件基类。

相对于微信框架中的page，Labrador自定义组件扩展了 `propTypes` 、 `props` 、 `children` 选项及 `onUpdate` 生命周期函数。`children` 选项代表当前组件中的子组件集合，此选项将在下文中叙述。

Labrador的目标是构建一个可以重用、嵌套的自定义组件方案，在现实情况中，当多个组件互相嵌套组合，就一定会遇到父子组件件的数据和消息传递。因为所有的组件都实现了 `setData` 方法，所以我们可以使用 `this.children.foobar.setData(data)` 或 `this.parent.setData(data)` 这样的代码调用来解决父子组件间的数据传递问题，但是，如果项目中出现大量这样的代码，那么数据流将变得非常混乱。

我们借鉴了 React.js 的思想，为组件增加了 props 机制。子组件通过 `this.props` 得到父组件给自己传达的参数数据。父组件怎样将数据传递给子组件，我们下文中叙述。

`onUpdate` 生命周期函数是当组件的 `props` 发生变化后被调用，类似React.js中的 `componentWillReceiveProps` 所以我们可以在此函数体内监测 `props` 的变化。

组件定义时的 `propTypes` 选项是对当前组件的props参数数据类型的定义。 `props` 选项代表的是当前组件默认的各项参数值。`propTypes` 、 `props` 选项都可以省略，但是强烈建议定义 `propTypes`，因为这样可以使得代码更清晰易懂，另外还可以通过Labrador自动检测props值类型，以减少BUG。为优化性能，只有在DEBUG模式下才会自动检测props值类型。

编译时加上 `-d` 参数时即可进入DEBUG模式，在代码中任何地方都可以使用魔术变量 `__DEBUG__` 来判断是否是DEBUG模式。

另外，Labrador自定义组件的 `setData` 方法，支持两种传参方式，第一种像微信框架一样接受一个 `object` 类型的对象参数，第二种方式接受作为KV对的两个参数，`setData` 方法将自动将其转为 `object`。

##### 布局 `src/compontents/title/title.xml`

```xml 
<view class="text-view">
  <text class="title-text" catchtap="handleTap" style="color:{{color}};">{{text}}</text>
</view>
```

XML布局文件和微信WXML文件语法完全一致，只是扩充了两个自定义标签 `<component/>` 和 `<list/>`，下文中详细叙述。

##### 样式 `src/compontents/title/title.less`

```css
.title-text {
  font-weight: bold;
  font-size: 2em;
}
```

虽然我们采用了LESS文件，但是由于微信小程序框架的限制，**不能**使用LESS的层级选择及嵌套语法。但是我们可以使用LESS的变量、mixin、函数等功能方便开发。

## 页面

我们要求所有的页面必须存放在 `pages` 目录中，每个页面的子目录中的文件格式和自定义组件一致，只是可以多出一个 `*.json` 配置文件。

#### 页面示例

下面是默认首页的示例代码：

##### 逻辑 `src/pages/index/index.js`

```js
import wx from 'labrador';
import List from '../../components/list/list';
import Title from '../../components/title/title';
import Counter from '../../components/counter/counter';

export default class Index extends wx.Component {
  data = {
    userInfo: {},
    mottoTitle: 'Hello World',
    count: 0
  };

  children = {
    list: new List(),
    motto: new Title({ text: '@mottoTitle', hello: '@mottoTitle' }),
    counter: new Counter({ count: '@count', onChange: '#handleCountChange' })
  };

  handleCountChange(count) {
    this.setData({ count });
  }

  //事件处理函数
  handleViewTap() {
    wx.navigateTo({
      url: '../logs/logs'
    });
  }

  async onLoad() {
    try {
      //调用应用实例的方法获取全局数据
      let userInfo = await wx.app.getUserInfo();
      //更新数据
      this.setData({ userInfo });
      this.update();
    } catch (error) {
      console.error(error.stack);
    }
  }

  onReady() {
    this.setData('mottoTitle', 'Labrador');
  }
}

```

页面代码的格式和自定义组件的格式一模一样，我们的思想是 **页面也是组件**。

js逻辑代码中同样使用 `export default` 语句导出了一个默认类，也不能手动调用 `Page()` 方法，因为在编译后，`pages` 目录下的所有js文件全部会自动调用 `Page()` 方法声明页面。

我们看到组件类中，有一个对象属性 `children` ，这个属性定义了该组件依赖、包含的其他自定义组件，在上面的代码中页面包含了三个自定义组件 `list` 、 `title` 和 `counter` ，这个三个自定义组件的 `key` 分别为 `list` 、 `motto` 和 `counter`。

自定义组件类在实例化时接受一个类型为 `object` 的参数，这个参数就是父组件要传给子组件的props数据。一般情况下，父组件传递给子组件的props属性在其生命周期中是不变的，这是因为JS的语法和小程序框架的限制，没有React.js的JSX灵活。但是我们可以传递一个以 `@` 开头的属性值，这样我们就可以把子组建的 `props` 属性值绑定到父组件的 `data` 上来，当父组件的 `data` 发生变化后，Labrador将自动更新子组件的 `props`。例如上边代码中，将子组件 `motto` 的 `text` 属性绑定到了 `@mottoTitle`。那么在 `onReady` 方法中，将父组件的 `mottoTitle` 设置为 `Labrador`，那么子组件 `motto` 的 `text` 属性就会自动变为 `Labrador`。如果属性值以 `#` 开头，则将父组件的属性（非data的属性）直接绑定到子组件 `props`，如上边代码中的 `#handleCountChange`，会将父组件的 `handleCountChange` 方法绑定到子组件的 `props.onChange` 属性，这样子组件中可以通过调用 `this.props.onChange(newValue)` 来通知父组件数据变化。

页面也是组件，所有的组件都拥有一样的生命周期函数onLoad, onReady, onShow, onHide, onUnload，onUpdate 以及setData函数。

`componets` 和 `pages` 两个目录的区别在于，`componets` 中存放的组件能够被智能加载，`pages` 目录中的组件在编译时自动加上 `Page()` 调用，所以，`pages` 目录中的组件不能被其他组件调用,否则将出现多次调用`Page()`的错误。如果某个组件需要重用，请存放在 `componets` 目录或打包成NPM包。

##### 布局 `src/pages/index/index.xml`

```xml
<view class="container">
  <view class="userinfo" catchtap="handleViewTap">
    <image class="userinfo-avatar" src="{{ userInfo.avatarUrl }}" background-size="cover"/>
    <text class="userinfo-nickname">{{ userInfo.nickName }}</text>
  </view>
  <view class="usermotto">
    <component key="motto" name="title"/>
  </view>
  <component key="list"/>
  <component key="counter"/>
</view>
```

XML布局代码中，使用了Labrador提供的 `<component/>` 标签，此标签的作用是导入一个自定义子组件的布局文件，标签有两个属性，分别为 `key` (必选)和 `name` (可选，默认为key的值)。`key` 与js逻辑代码中的组件 `key` 对应，`name` 是组件的目录名。`key` 用来绑定组件JS逻辑对象的 `children` 中对应的数据， `name` 用于在`src/componets` 和 `node_modules` 目录中寻找子组件模板。

##### 样式 `src/pages/index/index.less`

```css
@import 'list';
@import 'title';
@import 'counter';

.motto-title-text {
  font-size: 3em;
  padding-bottom: 1rem;
}

/* ... */
```

LESS样式文件中，我们使用了 `@import` 语句加载所有子组件样式，这里的 `@import 'list'` 语句按照LESS的语法，会首先寻找当前目录 `src/pages/index/` 中的 `list.less` 文件，如果找不到就会按照Labrador的规则智能地尝试寻找 `src/componets` 和 `node_modules` 目录中的组件样式。

接下来，我们定义了 `.motto-title-text` 样式，这样做是因为 `motto` key 代表的title组件的模板中（`src/compontents/title/title.xml`）有一个view 属于 `title-text` 类，编译时，Labrador将自动为其增加一个前缀 `motto-` ，所以编译后这个view所属的类为 `title-text motto-title-text` （可以查看 `dist/pages/index/index.xml`）。那么我们就可以在父组件的样式代码中使用 `.motto-title-text` 来重新定义子组件的样式。

Labrador支持多层组件嵌套，在上述的实例中，`index` 包含子组件 `list` 和 `title`，`list` 包含子组件 `title`，所以在最终显示时，`index` 页面上回显示两个 `title` 组件。

详细代码请参阅 `labrador init` 命令生成的示例项目。


## 自定义组件列表

Labrador 0.5版本后支持循环调用自定义组件生成一个列表。

##### 逻辑 `src/components/list/list.js`

```js
import wx from 'labrador';
import Title from '../title/title';
import Item from '../item/item';
import { sleep } from '../../utils/util';

export default class List extends wx.Component {

  data = {
    items: [
      { title: 'Labrador' },
      { title: 'Alaska' }
    ]
  };

  children = {
    title: new Title({ text: 'The List Title' }),
    listItems: new wx.List(Item, 'items', {
      item: '>>',
      title: '>title',
      isNew: '>isNew',
      onChange: '#handleChange'
    })
  };

  async onLoad() {
    await sleep(1000);
    this.setData({
      items: [{ title: 'Collie', isNew: true }].concat(this.data.items)
    });
  }

  handleChange(component, title) {
    let item = this.data.items[component.key];
    item.title = title;
    this.setData('items', this.data.items);
  }
}
```

在上边代码中的 `children.listItems` 子组件定义时，并没有直接实例化子组件类，而是实例化了一个 `labrador.List` 类，这个类是Labrador中专门用来管理组件列表。`labrador.List` 实例化时，接受三个参数：

第一个参数是列表中的自定义组件类，请将原始类传入即可，不用实例化。

第二个参数是父组件上 `data` 属性指向，指向的属性必须是一个数组，例如上述代码中，第二个参数为 `items` ，则当前父组件的 `data.items` 属性是一个数组，这个数组又多少个元素，那么子组件列表中就自动产生多少个子组件。子组件的数量跟随 `data.items` 数组动态变化，Labrador会自动实例化或销毁相应的子组件。销毁子组件时，子组件的 `onUnload()` 方法将会被调用。

第三个参数是子组件 `props` 数据绑定设置，如果属性值以 `>` 开头，则将 `data.items` 中对应元素的属性绑定到子组件的 `props`。如果属性值以 `#` 开头，则将父组件的方法绑定到子组件的 `props` 中。注意，因为子组件是一个列表，所以为了区别，父组件对应的方法被调用时，第一个参数为子组件的实例，第二个及其之后的参数才是子组件中传回的参数。如果属性值是 `>>` 则将整个列表项数据绑定到对应的 `props` 上。

##### 模板 `src/components/list/list.xml`

```xml
<view class="list">
  <component key="title" name="title"/>
  <list key="listItems" name="item"/>
</view>
```

在XML模板中，调用 `<list/>` 标签即可自动渲染子组件列表。和 `<component/>` 标签类似，`<list/>` 同样也有两个属性，`key` 和 `name`。Labrador编译后，会自动将 `<list/>` 标签编译成 `wx:for` 循环。

## 自动化测试

我们规定项目中所有后缀为 `*.test.js` 的文件为测试脚本文件。每一个测试脚本文件对应一个待测试的JS模块文件。例如 `src/utils/util.js` 和 `src/utils/utils.test.js` 。这样，项目中所有模块和其测试文件就全部存放在一起，方便查找和模块划分。这样规划主要是受到了GO语言的启发，也符合微信小程序一贯的目录结构风格。

在编译时，加上 `-t` 参数即可自动调用测试脚本完成项目测试，如果不加 `-t` 参数，则所有测试脚本不会被编译到 `dist` 目录，所以不必担心项目会肥胖。

#### 普通JS模块测试

测试脚本中使用 `export` 语句导出多个名称以 `test*` 开头的函数，这些函数在运行后会被逐个调用完成测试。如果test测试函数在运行时抛出异常，则视为测试失败，例如代码：

```js
// src/util.js
// 普通项目模块文件中的代码片段，导出了一个通用的add函数
export function add(a, b) {
  return a + b;
}
```

```js
// src/util.test.js
// 测试脚本文件代码片段

import assert from 'assert';

//测试 util.add() 函数
export function testAdd(exports) {
  assert(exports.add(1, 1) === 2);
}
```

代码中 `testAdd` 即为一个test测试函数，专门用来测试 `add()` 函数，在test函数执行时，会将目标模块作为参数传进来，即会将 `util.js` 中的 `exports` 传进来。

#### 自定义组件测试

自定义组件的测试脚本中可以导出两类测试函数。第三类和普通测试脚本一样，也为 `test*` 函数，但是参数不是 `exports` 而是运行中的、实例化后的组件对象。那么我们就可以在test函数中调用组件的方法或则访问组件的`props` 和 `data` 属性，来测试行为。另外，普通模块测试脚本是启动后就开始逐个运行 `test*` 函数，而组件测试脚本是当组件 `onReady` 以后才会开始测试。

自定义组件的第二类测试函数是以 `on*` 开头，和组件的生命周期函数名称一模一样，这一类测试函数不是等到组件 `onReady` 以后开始运行，而是当组件生命周期函数运行时被触发。函数接收两个参数，第一个为组件的对象引用，第二个为`run` 函数。比如某个组件有一个 `onLoad` 测试函数，那么当组件将要运行 `onLoad` 生命周期函数时，先触发 `onLoad` 测试函数，在测试函数内部调用 `run()` 函数，继续执行组件的生命周期函数，`run()` 函数返回的数据就是生命周期函数返回的数据，如果返回的是Promise，则代表生命周期函数是一个异步函数，测试函数也可以写为`async` 异步函数，等待生命周期函数结束。这样我们就可以获取`run()`前后两个状态数据，最后对比，来测试生命周期函数的运行是否正确。

第三类测试函数与生命周期测试函数类似，是以 `handle*` 开头，用以测试事件处理函数是否正确，是在对应事件发生时运行测试。例如：

```js
// src/components/counter/counter.test.js

export function handleTap(c, run) {
  let num = c.data.num;
  run();
  let step = c.data.num - num;
  if (step !== 1) {
    throw new Error('计数器点击一次应该自增1，但是自增了' + step);
  }
}
```

生命周期测试函数和事件测试函数只会执行一次，自动化测试的结果将会输出到Console控制台。


## 项目配置文件

`labrador init` 命令在初始化项目时，会在项目根目录中创建一个 `.labrador` 项目配置文件，如果你的项目是使用 labrador-cli 0.3 版本创建的，可以手动增加此文件。

配置文件为JSON格式，默认配置为：

```json
{
  "npmMap":{
  },
  "uglify":{
    "mangle": [],
    "compress": {
      "warnings": false
    }
  },
  "classNames": {
    "for-test":true
  }
}
```

`npmMap` 属性为NPM包映射设置，例如 `{"underscore":"lodash"}` 配置，如果你的源码中有`require('underscore')` 那么编译后将成为 `require('lodash')`。这样做是为了解决小程序的环境限制导致一些NPM包无法使用的问题。比如我们的代码必须依赖于包A，A又依赖于B，如果B和小程序不兼容，将导致A也无法使用。在这总情况下，我们可以Fork一份B，起名为C，将C中与小程序不兼容的代码调整下，最后在项目配置文件中将B映射为C，那么在编译后就会绕过B而加载C，从而解决这个问题。

`uglify` 属性为 UglifyJs2 的压缩配置，在编译时附加 `-m` 参数即可对项目中的所有文件进行压缩处理。

`classNames` 属性指定了不压缩的WXSS类名，在压缩模式下，默认会将所有WXSS类名压缩为非常短的字符串，并抛弃所有WXML页面中未曾使用的样式类，如果指定了该配置项，则指定的类不会被压缩和抛弃。这个配置在动态类名的情况下非常实用，比如XML中`class="text-{{color}}"`，在编译LESS时，无法确定LESS中的`.text-red`类是否被用到，所以需要配置此项强制保留`text-red`类。

## ChangeLog

#### 2016-10-09
**labrador** 0.3.0
- 重构自定义组件支持绑定子组件数据和事件

#### 2016-10-12
**labrador** 0.4.0
- 增加自定义组件props机制
- 自动化测试
- UglifyJS压缩集成
- NPM包映射
- 增加.labrador项目配置文件

#### 2016-10-13
**labrador** 0.4.2
- 修复组件setData方法优化性能产生的数据不同步问题
- 在DEBUG模式下输出调试信息

#### 2016-10-16
**labrador** 0.5.0
- 新增组件列表
- 重构XML模板编译器
- 编译时绑定事件改为事件发生时自动分派

## 贡献者

[郑州脉冲软件科技有限公司](https://maichong.it)

[梁兴臣](https://github.com/liangxingchen)

## 开源协议

本项目依据MIT开源协议发布，允许任何组织和个人免费使用。
