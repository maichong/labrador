
#[Labrador](https://github.com/maichong/labrador)

微信小程序模块化开发框架

## 特性
* 使用Labrador框架可以使微信开发者工具支持加载海量NPM包
* 支持ES6/ES7标准代码,使用async/await能够有效避免回调地狱
* 组件重用,对微信小程序框架进行了二次封装,实现了组件重用和嵌套
* 使用Editor Config及ESLint标准化代码风格，方便团队协作

## 安装

```
npm install -g labrador-cli
```

## 初始化项目

```
mkdir demo
cd demo
npm init
labrador init
```

## 项目目录结构

```sh
demo                 # 项目根目录
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

> **注意** dist目录中的所有文件是由labrador命令生成，请勿直接修改

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

## labrador 库

`labrador` 库对全局的 `wx` 变量进行了封装，将大部分 `wx` 对象中的方法进行了Promise支持， 除了以 `on*` 开头或以 `*Sync` 结尾的方法。在如下代码中使用 `labrador` 库。

```js
import wx from 'labrador';
```

我们建议不要再使用 `wx.getStorageSync()` 等同步阻塞方法，而在 `async` 函数中使用 `await wx.getStorage()` 异步非阻塞方法提高性能，除非特殊情况。

## app.js

`src/app.js` 示例代码如下：

```js
import wx from 'labrador';
import { sleep } from './utils/util';

export default class {
  globalData = {
    userInfo: null
  };

  async onLaunch() {
    //调用API从本地缓存中获取数据
    let logs = await wx.getStorage({ key: 'logs' }) || [];
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

代码中全部使用ES6/ES7标准语法。代码不必声明 `use strict` ，因为在编译时，所有代码都会强制使用严格模式。

代码中并未调用全局的 `App()` 方法，而是使用 `export` 语法默认导出了一个类，在编译后，Labrador会自动增加 `App()` 方法调用，所有请勿手动调用 `App()` 方法。

## 自定义组件

Labrador的自定义组件，是基于微信小程序框架的组件之上，进一步自定义组合，拥有逻辑处理和样式。这样做的目的请参见 [微信小程序开发三宗罪和解决方案](https://segmentfault.com/a/1190000007017985)

项目中通用自定义组件存放在 `src/compontents` 目录，一个组件一般由三个文件组成，`*.js` 、 `*.xml` 和 `*.less` 分别对应微信小程序框架的 `js` 、 `wxml` 和 `wxss` 文件。在Labardor项目源码中，我们特意采用了 `xml` 和 `less` 后缀以示区别。

#### 自定义组件示例

下面是一个简单的自定义组件代码实例：

逻辑 `src/compontents/title/title.js`

```js
import wx from 'labrador';
import randomColor  from '../../utils/random-color';

export default class Title extends wx.Component {
  data = {
    text: '',
    color: randomColor()
  };

  handleTap() {
    this.setData({
      color: randomColor()
    });
  }
}
```

布局 `src/compontents/title/title.js`

```xml 
<view class="text-view">
  <text class="title-text" catchtap="handleTap" style="color:{{color}};">{{text}}</text>
</view>
```

样式 `src/compontents/title/title.less`

```css
.title-text {
  font-weight: bold;
  font-size: 2em;
}
```

代码和微信小程序框架中的page很相似。最大的区别是在js逻辑代码中，没有调用全局的`Page()`函数声明页面，而是用 `export` 语法导出了一个默认的类，这个类需要继承与 `labrador.Component` 组件基类。

## 页面

我们要求所有的页面必须存放在 `pages` 目录中，每个页面的子目录中的文件格式和自定义组件一致，只是可以多出一个 `*.json` 配置文件。

#### 页面示例

下面是默认首页的示例代码：

逻辑 `src/pages/index/index.js`

```js
import wx from 'labrador';
import List from '../../components/list/list';
import Title from '../../components/title/title';

export default class Index extends wx.Component {
  data = {
    userInfo: {}
  };
  children = {
    list: new List(),
    motto: new Title({ text: 'Hello world' })
  };

  //事件处理函数
  handleViewTap() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  }

  async onLoad() {
    //调用应用实例的方法获取全局数据
    let userInfo = await wx.app.getUserInfo();
    //更新数据
    this.setData({
      userInfo: userInfo
    });
    this.update();
  }
}
```

布局 `src/pages/index/index.xml`

```xml
<view class="container">
  <view bindtap="handleViewTap" class="userinfo">
    <image class="userinfo-avatar" src="{{ userInfo.avatarUrl }}" background-size="cover"/>
    <text class="userinfo-nickname">{{ userInfo.nickName }}</text>
  </view>
  <view class="usermotto">
    <component key="motto" name="title"/>
  </view>
  <component key="list"/>
</view>
```

样式 

```css
@import 'list';
@import 'title';

.motto-title-text {
  font-size: 3em;
  padding-bottom: 1rem;
}

/* ... */
```

页面代码的格式和自定义组件的格式一模一样，我们的思想是 **页面也是组件**，页面和自定义组件的唯一差别是页面的代码存放在 `pages` 目录中。

js逻辑代码中同样使用 `export` 语句导出了一个默认类，也不能手动调用 `Page()` 方法，因为在编译后，`pages` 目录下的所有js文件全部会自动调用 `Page()` 方法声明页面。

我们看到组件类中，有一个对象属性 `children` ，这个属性定义了该组件依赖、包含的其他自定义组件，在上面的代码中页面包含了两个自定义组件 `list` 和 `title` ，这个两个自定义组件的 `key` 分别为 `list` 和 `motto` 。

xml布局代码中，使用了Labrador提供的 `<component/>` 标签，此标签的作用是导入一个自定义子组件的布局文件，标签有两个属性，分别为 `key` (必选)和 `name` (可选，默认为key的值)。`key` 与js逻辑代码中的组件 `key` 对应，`name` 用来在`src/componets` 和 `node_modules` 目录中寻找子组件模板。运行时，key对应的子组件逻辑代码类中的 `data` 将渲染至子组件模板中。

less样式文件中，我们使用了两条 `@import` 语句加载子组件样式，这里的 `@import 'list'` 语句按照LESS的语法，会首先寻找当前目录 `src/pages/index/` 中的 `list.less` 文件，如果找不到就会尝试寻找 `src/componets` 和 `node_modules` 目录中的组件样式。

接下来，我们定义了 `.motto-title-text` 样式，这样做是因为 `motto` key 代表的title组件的模板中有一个view 属于 `title-text` 类，编译时，Labrador将自动为其增加一个前缀 `motto-` ，所以编译后这个view所属的类为 `title-text motto-title-text` 那么我们就可以在父组件的样式代码中使用 `.motto-title-text` 重新定义子组件的样式。

> **注意** 虽然我们采用了LESS文件，但是由于微信小程序框架的限制，不能使用LESS的层级选择及嵌套语法。但是我们可以使用LESS的变量、mixin、函数等功能方便开发。

另外Labrador支持多层组件嵌套，在上述的实例中，`index` 包含子组件 `list` 和 `title`，`list` 包含子组件 `title`，所以在最终显示时，`index` 页面上回显示两个 `title` 组件。

详细代码请参阅 `labrador init` 命令生成的示例项目。

## 总结

页面也是组件，所有的组件都拥有一样的生命周期函数onLoad, onReady, onShow, onHide, onUnload 以及setData函数。

`componets` 和 `pages` 两个目录的区别在于，`componets` 中存放的组件能够被智能加载，`pages` 目录中的组件在编译时自动加上 `Page()` 调用，所以，`pages` 目录中的组件不能被其他组件调用，如果某个组件需要重用，请存放在 `componets` 目录或打包成NPM包。

## 贡献者

[郑州脉冲软件科技有限公司](https://maichong.it)

[梁兴臣](https://github.com/liangxingchen)

## 开源协议

本项目依据MIT开源协议发布，允许任何组织和个人免费使用。
