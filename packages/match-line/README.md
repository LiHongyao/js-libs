# 考试系统·连线题

推荐博文：稀土掘金·[浅谈 js+canvas 实现考试系统·拖拽连线题](https://juejin.cn/post/7278945628906487843)

# 安装

```shell
$ pnpm i @likg/match-line
```

```tsx
import MatchLine from '@likg/match-line';
const matchLine = new MatchLine(options: MatchLineOptions);
```

# MatchLineOptions

| 属性            | 数据类型                                  | 描述                                                         |
| --------------- | ----------------------------------------- | ------------------------------------------------------------ |
| container       | HTMLElement                               | 外层容器·包裹canvas和左右布局元素的容器<br />布局结构：div.container>div.leftItems+div.rightItem+canvas+backCanvas |
| canvas          | HTMLCanvasElement                         | 实际连线标签Canvas                                           |
| backCanvas      | HTMLCanvasElement                         | 模拟连线标签Canvas                                           |
| items           | NodeListOf\<HTMLElement>                  | 连线元素标签                                                 |
| itemActiveCls   | string                                    | 「可选」连线元素标签激活状态的类名，默认：active             |
| strokeStyle     | string \| CanvasGradient \| CanvasPattern | 「可选」画笔颜色                                             |
| lineWidth       | number                                    | 「可选」画笔粗细                                             |
| anwsers         | MatchLineOption                           | 「可选」用户连线答案·可选（在查看试卷详情以及纠错时必传      |
| standardAnwsers | MatchLineOption                           | 「可选」标准答案（在纠错时必传）                             |
| disabled        | boolean                                   | 「可选」是否禁用（在查看试卷详情以及纠错时必传true）         |
| onChange        | (anwsers: MatchLineOption) => void        | 每一次连线成功的回调·参数为连线结果集                        |

> 提示：
>
> `MatchLineOption` = `Record<string, string>`

# APIs

- `matchLine.reset()`：重置
- `matchLine.undo()`：撤销
- `matchLine.getAnwsers()`：获取连线结果
- `matchLine.checkAnwsers()`：纠错

# 使用指南

## 布局

```html
<div class="container">
  <!-- 工具栏 -->
  <div class="tools">
    <div class="button reset">重置</div>
    <div class="button undo">撤销</div>
    <div class="button check">纠错</div>
  </div>
  <div class="content">
    <!-- 左侧 -->
    <div class="list left">
      <div class="item" data-value="水果" data-ownership="L">水果</div>
      <div class="item" data-value="动物" data-ownership="L">动物</div>
      <div class="item" data-value="汽车" data-ownership="L">汽车</div>
      <div class="item" data-value="蔬菜" data-ownership="L">蔬菜</div>
    </div>
    <!-- 右侧 -->
    <div class="list right">
      <div class="item" data-value="🥕" data-ownership="R">🥕</div>
      <div class="item" data-value="🚗" data-ownership="R">🚗</div>
      <div class="item" data-value="🐒" data-ownership="R">🐒</div>
      <div class="item" data-value="🍌" data-ownership="R">🍌</div>
    </div>
    <!-- 实际连线标签 -->
    <canvas id="canvas" width="400" height="250"></canvas>
    <!-- 模拟连线标签 -->
    <canvas id="backCanvas" width="400" height="250"></canvas>

  </div>
</div>
```

> 提示：请严格按照上面的布局方式布局，连线元素必须设置 `data-value` 和 `data-ownership` 属性，便于处理连线逻辑。

## 代码示例（react）

**`Test.tsx`**

```tsx
import React, { useEffect, useState } from 'react';
import MatchLine from '@likg/match-line';
import './Test.less';

// -- 数据源
const dataSource = {
  水果: '🥕',
  动物: '🚗',
  汽车: '🐒',
  蔬菜: '🍌',
};

// -- 标准答案
const standardAnwsers = {
  水果: '🍌',
  动物: '🐒',
  汽车: '🚗',
  蔬菜: '🥕',
};

const Test: React.FC = React.memo(() => {
  const [matchLine, setMatchLine] = useState<MatchLine | null>(null);

  useEffect(() => {
    // -- 获取元素
    const container = document.querySelector('.lg-matching .content');
    const items = document.querySelectorAll('.lg-matching .item');
    const canvas = document.querySelector('#canvas');
    const backCanvas = document.querySelector('#backCanvas');

    // -- 初始化连线库
    if (container && items && canvas && backCanvas) {
      const matching = new MatchLine({
        container: container as HTMLElement,
        items: items as NodeListOf<HTMLElement>,
        canvas: canvas as HTMLCanvasElement,
        backCanvas: backCanvas as HTMLCanvasElement,
        itemActiveCls: 'active',
        standardAnwsers,
        onChange: (anwsers) => {
          console.log(anwsers);
        },
      });
      setMatchLine(matching);
    }
  }, []);

  const renderItems = (list: string[], ownership: 'L' | 'R') => {
    return list.map((item) => (
      <div
        className='item'
        key={item}
        data-value={item}
        data-ownership={ownership}
      >
        {item}
      </div>
    ));
  };
  return (
    <div className='lg-matching'>
      <div className='tools'>
        <button onClick={() => matchLine?.reset()}>重置</button>
        <button onClick={() => matchLine?.undo()}>撤销</button>
        <button
          onClick={() => {
            const anwsers = matchLine?.getAnwsers();
            console.log(anwsers);
          }}
        >
          查询
        </button>
        <button onClick={() => matchLine?.checkAnwsers()}>纠错</button>
      </div>
      <div className='content'>
        <div className='list left'>
          {renderItems(Object.keys(dataSource), 'L')}
        </div>
        <div className='list right'>
          {renderItems(Object.values(dataSource), 'R')}
        </div>
        <canvas id='canvas'></canvas>
        <canvas id='backCanvas'></canvas>
      </div>
    </div>
  );
});

export default Test;

```

**`Test.less`**

```less
.lg-matching {
	width: 400px;
	height: auto;
	margin: 100px auto;
	.tools {
		margin-bottom: 16px;
		button {
			margin-right: 8px;
		}
	}
	.content {
		border: 1px dashed #ccc;
		position: relative;
		box-sizing: border-box;
		padding: 24px;
		display: flex;
		justify-content: space-between;
		align-items: centers;
		.item {
			width: 100px;
			height: 40px;
			background-color: #fff;
			display: flex;
			justify-content: center;
			align-items: center;
			border-radius: 4px;
			cursor: pointer;
			user-select: none;
			color: #555;
			position: relative;
			z-index: 1;
			&.active {
				background: #6495ed;
				color: #fff;
			}
			&:not(:last-child) {
				margin-bottom: 16px;
			}
		}
		canvas {
			position: absolute;
			top: 0;
			left: 0;
		}
	}
}
```

# 后续

我将持续优化升级 **MatchLine**，如果大家有什么疑问或建议欢迎留言。
