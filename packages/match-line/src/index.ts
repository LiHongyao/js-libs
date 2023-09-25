/**
 * Author：李鸿耀
 * Email：lihy_online@163.com
 * HomePage：https://github.com/lihongyao
 */

// --> 选项数据结构
/*const 选项数据结构 = [
  { leftOption: '水果', rightOption: '🥕' },
  { leftOption: '动物', rightOption: '🚗' },
  { leftOption: '汽车', rightOption: '🐒' },
  { leftOption: '蔬菜', rightOption: '🍌' },
];*/

// --> 答案数据结构
/*const 答案数据结构 = {
  水果: '🥕',
  动物: '🚗',
  汽车: '🐒',
  蔬菜: '🍌',
};*/

interface Point {
	x1: number;
	y1: number;
	x2: number;
	y2: number;
}
interface BackLinesItemProps {
	key: string;
	point: Point;
}
interface CheckAnwsersItemProps {
	isOk: boolean;
	point: Point;
}
type QueryElementType = HTMLElement | null;

/**
 * 连线题选项数据结构
 */
export type MatchLineOptions = Array<{
	leftOption: string;
	rightOption: string;
}>;
/**
 * 连线题答案数据结构
 */
export type MatchLineAnwsers = Record<string, string>;
/**
 * 连线题配置项
 */
export interface MatchLineConfigs {
	/** id */
	id: string;
	/** 外层容器·包裹canvas和左右布局元素的容器，布局结构：div.container>div.leftItems+div.rightItem+canvas+backCanvas */
	container: HTMLElement;
	/** 实际连线标签Canvas */
	canvas: HTMLCanvasElement;
	/** 模拟连线标签Canvas */
	backCanvas: HTMLCanvasElement;
	/** 连线元素集合 */
	items: NodeListOf<HTMLElement>;
	/** 连线元素标签激活状态的类名，默认：active */
	itemActiveCls?: string;
	/** 画笔相关 */
	strokeStyle?: string | CanvasGradient | CanvasPattern;
	lineWidth?: number;
	/** 用户连线答案·可选（在查看试卷详情以及纠错时必传） */
	anwsers?: MatchLineAnwsers;
	/** 标准答案·可选（在纠错时必传） */
	standardAnwsers?: MatchLineAnwsers;
	/** 是否禁用·可选（在查看试卷详情以及纠错时必传true） */
	disabled?: boolean;
	/** 是否开启调试模式，默认false */
	debug?: boolean;
	/** 每一次连线成功的回调·参数为连线结果集 */
	onChange: (anwsers: MatchLineAnwsers) => void;
}

export default class MatchLine {
	/** 容器元素 */
	private container: HTMLElement;
	/** 连线元素标签 */
	private items: NodeListOf<HTMLElement>;
	/** 连线元素激活状态类名 */
	private itemActiveCls: string;
	/** 画板（因为实际连线画布和模拟连线画布布局信息一致，所以这里的canvas随便记录哪一个都可以） */
	private canvas: HTMLCanvasElement;
	/** 实际连线画布*/
	private ctx: CanvasRenderingContext2D | null;
	/** 模拟连线画布 */
	private backCtx: CanvasRenderingContext2D | null;
	/** 画笔相关 */
	private strokeStyle: string | CanvasGradient | CanvasPattern;
	private lineWidth: number;
	/** 标识是否触发连线 */
	private trigger = false;
	/** 每一次连接线开始点（结束点动态计算，无需记录） */
	private startPoint = { x: 0, y: 0 };
	/** 每一次连接线起始元素 */
	private startElement: QueryElementType = null;
	private endElement: QueryElementType = null;
	/** 记录已经连接好的线（用于回显、撤销和重置） */
	private backLines: BackLinesItemProps[] = [];
	/** 用户连线答案 */
	private anwsers: MatchLineAnwsers;
	/** 标准答案，用于纠错 */
	private standardAnwsers?: MatchLineAnwsers;
	/** 是否禁用 */
	private disabled: boolean;
	/** 是否开启调试模式，默认false */
	private debug: boolean;
	/** 标识，用于判断连线元素，生成规则：id+随机字符 */
	private tag: string;
	/** 每一次连线成功的回调 */
	private onChange: (anwsers: MatchLineAnwsers) => void;

	/**
	 * 构造函数
	 * @param options
	 */
	constructor(options: MatchLineConfigs) {
		// 解构Options
		const {
			id,
			container,
			canvas,
			backCanvas,
			items,
			itemActiveCls = 'active',
			strokeStyle = '#6495ED',
			lineWidth = 1,
			anwsers,
			standardAnwsers,
			disabled = false,
			debug = false,
			onChange
		} = options;

		// 存储变量
		this.tag = id + '__' + Math.random().toString(36).slice(2);
		this.container = container;
		this.items = items;
		this.itemActiveCls = itemActiveCls;
		this.anwsers = anwsers || {};
		this.standardAnwsers = standardAnwsers;
		this.disabled = disabled;
		this.debug = debug;
		this.onChange = onChange;

		// 画布 & 画笔相关
		this.canvas = canvas;
		this.ctx = canvas.getContext('2d');
		this.backCtx = backCanvas.getContext('2d');

		this.strokeStyle = strokeStyle;
		this.lineWidth = lineWidth;

		const { width, height } = container.getBoundingClientRect();
		canvas.width = backCanvas.width = width;
		canvas.height = backCanvas.height = height;
		this.debug && console.log('[MatchLine]：初始化成功');
		// 计算元素信息
		this.convertItems(items);
		// 事件监听
		items.forEach((item) => (item.onmousedown = this.mousedown.bind(this)));
		document.onmousemove = this.mousemove.bind(this);
		document.onmouseup = this.mouseup.bind(this);
		// 判断是否渲染连线
		if (anwsers) {
			this.echoAnwsers();
		}
	}

	/**
	 * 计算连线元素在屏幕的位置
	 * @param element
	 * @returns
	 */
	private calcRect(element: HTMLElement) {
		const { width, height } = element.getBoundingClientRect();
		let parentElement = element.offsetParent as HTMLElement | null;
		const rect = {
			top: element.offsetTop,
			left: element.offsetLeft,
			width,
			height
		};
		while (parentElement) {
			rect.top += parentElement.offsetTop;
			rect.left += parentElement.offsetLeft;
			parentElement = parentElement.offsetParent as HTMLElement | null;
		}
		return rect;
	}

	/**
	 * 计算节点信息
	 * @param canvas
	 * @param items
	 */
	private convertItems(items: NodeListOf<HTMLElement>) {
		// 获取canvas相对于屏幕的坐标
		const { left: canvasLeft, top: canvasTop } = this.calcRect(this.canvas);
		items.forEach((item) => {
			// 每一次重载时，清除连线状态（响应式框架在组件刷新后会复用组件）
			item.classList.remove(this.itemActiveCls);
			// 获取元素归属：左侧还是右侧·用于计算元素锚点坐标
			const ownership = item.dataset.ownership;
			// 获取元素在屏幕上的信息
			const { left, top, width, height } = this.calcRect(item);
			// 记录元素锚点坐标
			const anchorX = left - canvasLeft + (ownership === 'L' ? width : 0);
			const anchorY = top - canvasTop + height / 2;
			item.dataset.anchorX = String(anchorX);
			item.dataset.anchorY = String(anchorY);
			// 标识当前元素是否连线
			item.dataset.checked = '0';
			// 标识当前元素为连线元素s
			item.dataset.tag = this.tag;
			// 绘制锚点，查看锚点位置是否准确（调试模式时呈现）
			if (this.debug) {
				this.ctx?.beginPath();
				this.ctx?.arc(anchorX, anchorY, 4, 0, Math.PI * 2);
				this.ctx?.stroke();
				this.ctx?.closePath();
			}
		});
		this.debug && console.log('[MatchLien]：元素锚点信息已挂载');
	}

	/**
	 * 鼠标按下
	 * @param event
	 */
	private mousedown(event: MouseEvent) {
		// 如果禁用，不做任何处理
		if (this.disabled) return;
		// 获取鼠标按下的元素
		const itemElement = event.currentTarget as HTMLElement;
		// 高亮显示按下的元素
		itemElement.classList.add(this.itemActiveCls);
		// 记录每一次连线的开始元素
		this.startElement = itemElement;
		// 更新每一次连线开始点信息
		this.startPoint.x = +itemElement.dataset.anchorX!;
		this.startPoint.y = +itemElement.dataset.anchorY!;
		// 标识触发连线，用于在mousemove中判断是否需要处理后续的逻辑
		this.trigger = true;
	}
	/**
	 * 鼠标按下+移动
	 * @param event
	 * @returns
	 */
	private mousemove(event: MouseEvent) {
		if (!this.trigger || !this.ctx) return;
		/****************
		 * 处理连线
		 ****************/
		// 获取鼠标在屏幕上的位置
		const { clientX, clientY } = event;
		// 计算鼠标在画板中的位置
		const { left, top } = this.canvas.getBoundingClientRect();
		const endPoint = { x: clientX - left, y: clientY - top };
		// 连线：实际画板
		this.ctx.strokeStyle = this.strokeStyle;
		this.ctx.lineWidth = this.lineWidth;
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.ctx.beginPath();
		this.ctx.moveTo(this.startPoint.x, this.startPoint.y);
		this.ctx.lineTo(endPoint.x, endPoint.y);
		this.ctx.closePath();
		this.ctx.stroke();

		/****************
		 * 处理后续逻辑
		 ****************/

		// 获取鼠标经过的元素
		const overElement = document.elementFromPoint(
			clientX,
			clientY
		) as HTMLElement;
		// 获取开始元素归属：左侧还是右侧
		const ownership = this.startElement?.dataset.ownership;
		// 如果鼠标经过的元素等于目标元素，不作任何处理
		if (overElement === this.endElement) return;
		// 判断是否命中目标元素，条件如下（同时满足）
		// ① 鼠标经过的元素必须必须是连线元素（可通过判断 data-tag 来判断）
		// ② 鼠标经过的元素和开始元素不在同一侧
		// ③ 鼠标经过的元素未被连线
		const condition1 = overElement?.dataset.tag === this.tag;
		const condition2 = overElement?.dataset.ownership !== ownership;
		const condition3 = overElement?.dataset.checked !== '1';
		if (condition1 && condition2 && condition3) {
			// 记录目标元素
			this.endElement = overElement;
			// 更新目标元素状态（高亮显示）
			this.endElement.classList.add(this.itemActiveCls);
			// 将开始元素和目标元素标识为已连线
			this.endElement.dataset.checked = '1';
			this.startElement!.dataset.checked = '1';
		}
		// 如果没有命中目标元素，但是目标元素又存在，则移除相关状态
		else if (this.endElement) {
			this.endElement.classList.remove(this.itemActiveCls);
			this.endElement.dataset.checked = this.startElement!.dataset.checked =
				'0';
			this.endElement = null;
		}
	}

	/**
	 * 鼠标抬起
	 * @returns
	 */
	private mouseup() {
		if (!this.trigger) return;

		// 如果开始元素存在且未被连线，则恢复开始元素的状态
		if (this.startElement && this.startElement.dataset.checked !== '1') {
			this.startElement.classList.remove(this.itemActiveCls);
		}
		// 完成连线：开始元素和目标元素同时存在，并且被标识选中
		if (
			this.startElement &&
			this.endElement &&
			this.startElement.dataset.checked === '1' &&
			this.endElement.dataset.checked === '1'
		) {
			// 获取连线始末坐标点
			const { anchorX: x1, anchorY: y1 } = this.startElement.dataset;
			const { anchorX: x2, anchorY: y2 } = this.endElement.dataset;
			// 获取开始元素归属：左侧还是右侧
			const ownership = this.startElement.dataset.ownership;
			// 获取开始元素和目标元素的值
			const startValue = this.startElement.dataset.value!;
			const endValue = this.endElement.dataset.value!;
			// 判断开始元素是否已经连线
			const keys = Object.keys(this.anwsers);
			const values = Object.values(this.anwsers);
			if (keys.includes(startValue) || values.includes(startValue)) {
				// 已连线，处理步骤
				// ① 找到已连线的目标元素的value·注意：可能在Map结构的左侧，也可能在右侧
				let key = '';
				let value = '';
				for (let i = 0; i < keys.length; i++) {
					const k = keys[i];
					const v = values[i];
					if ([k, v].includes(startValue)) {
						key = k;
						value = k === startValue ? v : k;
						break;
					}
				}
				// ② 根据targetValue找到目标元素
				const sel = `[data-value="${value}"]`;
				const tarElement: QueryElementType = this.container.querySelector(sel);
				if (!tarElement) return; // 如果目标元素不存在，则不做后续处理
				// ③ 恢复目标元素的状态（标识+高亮状态）
				tarElement.dataset.checked = '0';
				tarElement.classList.remove(this.itemActiveCls);
				// ④ 将对应的数据从记录中移除（因为后面会重新插入数据）
				delete this.anwsers[key];
				const index = this.backLines.findIndex((item) => item.key === key);
				if (index >= 0) {
					this.backLines.splice(index, 1);
				}
			}
			// 未连线
			const k = ownership === 'L' ? startValue : endValue;
			const v = ownership === 'L' ? endValue : startValue;
			this.anwsers[k] = v;
			this.onChange({ ...this.anwsers });
			this.backLines.push({
				key: k,
				point: {
					x1: +(x1 || 0),
					y1: +(y1 || 0),
					x2: +(x2 || 0),
					y2: +(y2 || 0)
				}
			});
			this.drawLines();
		}

		// 恢复元素状态
		this.trigger = false;
		this.startElement = null;
		this.endElement = null;
		// 清空实际连线画布
		this.ctx?.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}
	/**
	 * 模拟连线
	 * @returns
	 */
	private drawLines() {
		if (!this.backCtx) return;
		this.backCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.backCtx.strokeStyle = this.strokeStyle;
		this.backCtx.lineWidth = this.lineWidth;
		this.backLines.map(({ point: { x1, x2, y1, y2 } }) => {
			this.backCtx?.beginPath();
			this.backCtx?.moveTo(x1, y1);
			this.backCtx?.lineTo(x2, y2);
			this.backCtx?.closePath();
			this.backCtx?.stroke();
		});
	}

	/**
	 * 回显连线
	 * 触发时机：在创建示例时，如果传入了anwsers时调用
	 */
	private echoAnwsers() {
		// 遍历Map结构，拿到key-value值 → key标识左侧/value标识右侧
		const keys = Object.keys(this.anwsers);
		keys.forEach((key) => {
			if (this.anwsers.hasOwnProperty(key)) {
				const value = this.anwsers[key];
				// 获取开始元素和目标元素
				const leftSel = `[data-value="${key}"]`;
				const rightSel = `[data-value="${value}"]`;
				const leftElement: QueryElementType =
					this.container.querySelector(leftSel);
				const rightElement: QueryElementType =
					this.container.querySelector(rightSel);
				if (leftElement && rightElement) {
					// 更新选中状态
					leftElement.dataset.checked = rightElement.dataset.checked = '1';
					// 高亮显示元素
					leftElement.classList.add('active');
					rightElement.classList.add('active');
					// 计算坐标
					const { anchorX: x1, anchorY: y1 } = leftElement.dataset;
					const { anchorX: x2, anchorY: y2 } = rightElement.dataset;
					// 拼装数据
					this.backLines.push({
						key,
						point: {
							x1: +(x1 || 0),
							y1: +(y1 || 0),
							x2: +(x2 || 0),
							y2: +(y2 || 0)
						}
					});
				}
			}
		});
		this.drawLines();
	}

	/**
	 * 重置画板
	 */
	public reset() {
		this.backCtx?.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.items.forEach((item) => {
			item.classList.remove(this.itemActiveCls);
			item.dataset.checked = '0';
		});
		this.anwsers = {};
		this.backLines = [];
		this.onChange({ ...this.anwsers });
	}

	/**
	 * 撤销
	 */
	public undo() {
		const line = this.backLines.pop();
		if (line) {
			const { key } = line;
			const leftSel = `[data-value="${key}"]`;
			const rightSel = `[data-value="${this.anwsers[key]}"]`;
			delete this.anwsers[key];
			const leftElement: QueryElementType =
				this.container.querySelector(leftSel);
			const rightElement: QueryElementType =
				this.container.querySelector(rightSel);
			if (leftElement && rightElement) {
				leftElement.dataset.checked = rightElement.dataset.checked = '0';
				leftElement.classList.remove(this.itemActiveCls);
				rightElement.classList.remove(this.itemActiveCls);
				this.drawLines();
			}
			this.onChange({ ...this.anwsers });
		} else {
			this.debug && console.log('[MatchLine]：当前无可撤销的记录');
		}
	}
	/**
	 * 获取连线结果
	 * @returns
	 */
	public getAnwsers() {
		return { ...this.anwsers };
	}

	/**
	 * 纠错
	 */
	public checkAnwsers() {
		// 获取答案keys
		const keys = Object.keys(this.anwsers);
		// 异常处理
		if (!this.standardAnwsers || !this.backCtx || keys.length === 0) return;
		// 定义变量，记录连线信息
		const lines: CheckAnwsersItemProps[] = [];
		// 遍历keys
		keys.forEach((key) => {
			if (this.anwsers.hasOwnProperty(key)) {
				const value = this.anwsers[key];
				/****************
				 * 找到用户连线的数据
				 ****************/
				const leftSel = `[data-value="${key}"]`;
				const rightSel = `[data-value="${value}"]`;
				const leftElement: QueryElementType =
					this.container.querySelector(leftSel);
				const rightElement: QueryElementType =
					this.container.querySelector(rightSel);
				if (leftElement && rightElement) {
					// 更新选中状态
					leftElement.dataset.checked = rightElement.dataset.checked = '1';
					// 高亮显示元素
					leftElement.classList.add(this.itemActiveCls);
					rightElement.classList.add(this.itemActiveCls);
					// 计算坐标
					const { anchorX: x1, anchorY: y1 } = leftElement.dataset;
					const { anchorX: x2, anchorY: y2 } = rightElement.dataset;
					/****************
					 * 处理纠错逻辑
					 ****************/
					// 获取答案
					const anwser = this.standardAnwsers![key];
					// 拼装数据
					lines.push({
						isOk: value === anwser,
						point: {
							x1: +(x1 || 0),
							y1: +(y1 || 0),
							x2: +(x2 || 0),
							y2: +(y2 || 0)
						}
					});
				}
			}
		});
		// 绘制模拟连线画板
		this.backCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		lines.forEach(({ isOk, point: { x1, y1, x2, y2 } }) => {
			this.backCtx!.strokeStyle = isOk ? '#3CB371' : '#DC143C';
			this.backCtx!.beginPath();
			this.backCtx!.moveTo(x1, y1);
			this.backCtx!.lineTo(x2, y2);
			this.backCtx!.stroke();
		});
	}
}
