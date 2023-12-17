# 安装

```shell
$ pnpm install @likg/magnifier
```


# 使用

```tsx
import Magnifier from "@likg/magnifier";

const magnifier = new Magnifier(options);

// -- 挂载放大镜
magnifier.mount();
// -- 卸载放大镜
magnifier.destory();
```

> 提示：实际使用中，您只需要 挂载 和 卸载 两个API方法即可。

# MagnifierOptions

```ts
interface MagnifierOptions {
	/** 放大镜初始尺寸，默认值200x200 */
	initialSize?: Size;
	/** 放大镜最小尺寸，默认值100x100 */
	minSize?: Size;
	/** 放大镜最大尺寸，默认值500x500 */
	maxSize?: Size;
	/** 四周触发拖拽缩放的间距，默认值 20 */
	resizeSpacing?: number;
	/** 缩放比例，默认值 1 */
	scaleRatio?: number;
	/** 边框颜色，默认值 #7B68EE */
	borderColor?: string;
	/** 调试模式 */
	debug?: boolean;
}
```

# 尾言

`@likg/magnifier` 主要依赖 [html2canvas](https://html2canvas.hertzen.com/) 实现，当你发现放大镜内容不完整时，可以参考 html2canvas 关于 CSS 样式的兼容。

推荐阅读博文 [基于原生 js + html2canvas 实现网页放大镜](https://juejin.cn/spost/7313242064196141065) 了解该库的封装思路。
