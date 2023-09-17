/**
 * Author：李鸿耀
 * Email：lihy_online@163.com
 * HomePage：https://github.com/lihongyao
 */

export interface MatchLineOptions {
	/**
	 * 外层容器·包裹canvas和左右布局元素的容器，
	 * 布局结构：div.container>div.leftItems+div.rightItem+canvas+backCanvas
	 */
	container: HTMLElement;
	/** 实际连线标签Canvas */
	canvas: HTMLCanvasElement;
	/** 模拟连线标签Canvas */
	backCanvas: HTMLCanvasElement;
	/** 连线元素标签 */
	items: NodeListOf<HTMLElement>;
	/** 连线元素标签激活状态的类名，默认：active */
	itemActiveCls: string;
	/** 画笔相关 */
	strokeStyle?: string | CanvasGradient | CanvasPattern;
	lineWidth?: number;
	/** 用户连线答案·可选（在查看试卷详情以及纠错时必传） */
	anwsers?: MatchLineAnwsersProps;
	/** 标准答案·可选（在纠错时必传） */
	standardAnwsers?: MatchLineAnwsersProps;
	/** 是否禁用·可选（在查看试卷详情以及纠错时必传true） */
	disabled?: boolean;
	/** 每一次连线成功的回调·参数为连线结果集 */
	onChange: (anwsers: MatchLineAnwsersProps) => void;
}

/**
 * 答案数据结构
 * 示例：[['L1', 'R1'], ['L2', 'R2], ...]
 * 每一个答案元素集合中：
 * ① 下标为0，表示左侧元素id
 * ② 下标为1，表示右侧元素id
 */
type MatchLineAnwserItemProps = string[];
export type MatchLineAnwsersProps = MatchLineAnwserItemProps[];

interface Point {
	x1: number;
	y1: number;
	x2: number;
	y2: number;
}
interface BackLinesItemProps {
	anwser: MatchLineAnwserItemProps;
	point: Point;
}
interface CheckAnwserItemProps {
	isOk: boolean;
	point: Point;
}

export default class MatchLine {
	/** 连线元素标签 */
	private items: NodeListOf<HTMLElement>;
	/** 实际连线画布*/
	private ctx: CanvasRenderingContext2D | null;
	/** 模拟连线画布 */
	private backCtx: CanvasRenderingContext2D | null;
	/** 连线元素激活状态类名 */
	private itemActiveCls: string;
	/** 画笔相关 */
	private strokeStyle: string | CanvasGradient | CanvasPattern;
	private lineWidth: number;
	/** 画布相关 */
	private canvasWidth = 0;
	private canvasHeight = 0;
	private canvasTop = 0;
	private canvasLeft = 0;
	/** 标识是否触发连线 */
	private trigger = false;
	/** 每一次连接线开始点（结束点动态计算，无需记录） */
	private startPoint = { x: 0, y: 0 };
	/** 每一次连接线起始元素 */
	private startElement: HTMLElement | null = null;
	private endElement: HTMLElement | null = null;
	/** 记录已经连接好的线 */
	private backLines: BackLinesItemProps[] = [];
	/** 标准答案，用于纠错，数据格式：[[L1, R1], [L2, R2], ...] */
	private standardAnwsers?: MatchLineAnwsersProps;
	/** 每一次连线成功的回调 */
	private onChange: (anwsers: MatchLineAnwsersProps) => void;
	/** 是否禁用 */
	private disabled: boolean;
	/** 用户连线答案 */
	private anwsers: MatchLineAnwsersProps = [];

	/**
	 * 构造函数
	 * @param options
	 */
	constructor(options: MatchLineOptions) {
		// 解构Options
		const {
			container,
			canvas,
			backCanvas,
			items,
			itemActiveCls = 'active',
			strokeStyle = 'blue',
			lineWidth = 2,
			anwsers = [],
			standardAnwsers,
			disabled = false,
			onChange
		} = options;

		// 存储变量
		this.itemActiveCls = itemActiveCls;
		this.items = items;
		this.anwsers = anwsers;
		this.standardAnwsers = standardAnwsers;
		this.disabled = disabled;
		this.onChange = onChange;

		// 画布 & 画笔相关
		this.ctx = canvas.getContext('2d');
		this.backCtx = backCanvas.getContext('2d');

		this.strokeStyle = strokeStyle;
		this.lineWidth = lineWidth;

		const { width, height } = container.getBoundingClientRect();
		this.canvasWidth = canvas.width = backCanvas.width = width;
		this.canvasHeight = canvas.height = backCanvas.height = height;

		// 计算元素信息
		this.calcRect(canvas, items);
		// 缩放窗口时，实时更新数据
		const that = this;
		window.onresize = () => that.calcRect(canvas, items);
		window.onscroll = () => that.calcRect(canvas, items);
		// 事件监听
		items.forEach((item) => (item.onmousedown = this.mousedown.bind(this)));
		document.onmousemove = this.mousemove.bind(this);
		document.onmouseup = this.mouseup.bind(this);
		// 判断是否渲染连线
		if (this.anwsers.length > 0) {
			this.echoAnwsers();
		}
	}

	/**
	 * 计算节点信息
	 * 在调整视窗大小以及滚动窗口时需动态调整，避免计算连线坐标异常
	 * @param canvas
	 * @param items
	 */
	private calcRect(canvas: HTMLCanvasElement, items: NodeListOf<HTMLElement>) {
		// 更新canvas距离屏幕左上角的位置
		const rect = canvas.getBoundingClientRect();
		this.canvasTop = rect.top;
		this.canvasLeft = rect.left;
		// 记录节点信息
		this.ctx?.clearRect(0, 0, canvas.width, canvas.height);
		items.forEach((item) => {
			// 获取元素在屏幕上的信息
			const { width, height } = item.getBoundingClientRect();
			// 获取元素归属：左侧还是右侧·用于计算元素锚点坐标
			const ownership = item.dataset.ownership;
			// 记录元素锚点坐标
			const anchorX =
				ownership === 'L' ? item.offsetLeft + width : item.offsetLeft;
			const anchorY = item.offsetTop + height / 2;
			item.dataset.anchorX = String(anchorX);
			item.dataset.anchorY = String(anchorY);
			// 标识当前元素是否连线
			item.dataset.checked = '0';
			// 如果用户传入了anwsers，则渲染连线结果

			// 绘制锚点，查看锚点位置是否准确（临时代码）
			// this.ctx?.beginPath();
			// this.ctx?.arc(anchorX, anchorY, 4, 0, Math.PI * 2);
			// this.ctx?.stroke();
			// this.ctx?.closePath();
		});
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
		// 阻止事件冒泡/默认行为
		event.stopPropagation();
		event.preventDefault();
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
		const endPoint = {
			x: clientX - this.canvasLeft,
			y: clientY - this.canvasTop
		};
		// 连线：实际画板
		this.ctx.strokeStyle = this.strokeStyle;
		this.ctx.lineWidth = this.lineWidth;
		this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
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
		// ① 鼠标经过的元素必须包含类名 item
		// ② 鼠标经过的元素和开始元素不在同一侧
		// ③ 鼠标经过的元素未被连线
		const condition1 = overElement?.classList.contains('item');
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
		// 阻止事件冒泡/默认行为
		event.stopPropagation();
		event.preventDefault();
	}

	/**
	 * 鼠标抬起
	 * @returns
	 */
	private mouseup(event: MouseEvent) {
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
			// 获取开始元素的id
			const startId = this.startElement.id;
			// 判断开始元素是否已经完成连线·如果已完成，则遍历backLines，判断存储答案的集合中是否包含开始元素的id，存在则更新index
			let index = -1;
			for (let i = 0; i < this.backLines.length; i++) {
				const item = this.backLines[i];
				if (item.anwser.includes(startId)) {
					index = i;
					break;
				}
			}
			// 如果元素已经完成连线，则需将连线的目标元素恢复成未连线状态，具体步骤
			// ① 获取目标元素的ID
			// ② 根据ID获取目标元素
			// ③ 恢复目标元素的状态（标识+高亮状态）
			// ④ 将对应的数据从记录中移出（因为后面会重新插入数据）
			if (index !== -1) {
				const tarElementId =
					this.backLines[index].anwser[ownership === 'L' ? 1 : 0];
				const tarElement = document.getElementById(tarElementId) as HTMLElement;
				tarElement.dataset.checked = '0';
				tarElement.classList.remove(this.itemActiveCls);
				this.backLines.splice(index, 1);
			}

			// 组装数据，存入记录
			this.backLines.push({
				anwser:
					ownership === 'L'
						? [this.startElement.id, this.endElement.id]
						: [this.endElement.id, this.startElement.id],
				point: {
					x1: +(x1 || 0),
					y1: +(y1 || 0),
					x2: +(x2 || 0),
					y2: +(y2 || 0)
				}
			});
			this.anwsers = this.getAnwsers();
			this.onChange([...this.anwsers]);
			// 绘制连线结果
			this.drawLines();
		}

		// 恢复元素状态
		this.trigger = false;
		this.startElement = null;
		this.endElement = null;
		// 清空实际连线画布
		this.ctx?.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
		// 阻止事件冒泡/默认行为
		event.stopPropagation();
		event.preventDefault();
	}
	/**
	 * 模拟连线
	 * @returns
	 */
	private drawLines() {
		if (!this.backCtx) return;
		this.backCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
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
		this.anwsers.forEach(([startId, endId]) => {
			// 获取开始元素和目标元素
			const startElement = document.getElementById(startId);
			const endElement = document.getElementById(endId);
			if (startElement && endElement) {
				// 更新选中状态
				startElement.dataset.checked = endElement.dataset.checked = '1';
				// 高亮显示元素
				startElement.classList.add(this.itemActiveCls);
				endElement.classList.add(this.itemActiveCls);
				// 计算坐标
				const { anchorX: x1, anchorY: y1 } = startElement.dataset;
				const { anchorX: x2, anchorY: y2 } = endElement.dataset;
				// 拼装数据
				this.backLines.push({
					anwser: [startId, endId],
					point: {
						x1: +(x1 || 0),
						y1: +(y1 || 0),
						x2: +(x2 || 0),
						y2: +(y2 || 0)
					}
				});
				this.drawLines();
			}
		});
	}

	/**
	 * 重置画板
	 */
	public reset() {
		this.backCtx?.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
		this.items.forEach((item) => {
			item.classList.remove(this.itemActiveCls);
			item.dataset.checked = '0';
		});
		this.backLines = [];
	}

	/**
	 * 撤销
	 */
	public undo() {
		const line = this.backLines.pop();
		if (line) {
			const {
				anwser: [startId, endId]
			} = line;
			const startElement = document.getElementById(startId);
			const endElement = document.getElementById(endId);
			if (startElement && endElement) {
				startElement.dataset.checked = endElement.dataset.checked = '0';
				startElement.classList.remove(this.itemActiveCls);
				endElement.classList.remove(this.itemActiveCls);
				this.drawLines();
			}
		}
	}
	/**
	 * 获取连线结果
	 * 数据结构：[[id1, id2], [id3, id4]...]
	 * @returns
	 */
	public getAnwsers() {
		const anwsers: MatchLineAnwsersProps = [];
		this.backLines.forEach(({ anwser }) => anwsers.push([...anwser]));
		return anwsers;
	}

	/**
	 * 纠错
	 */
	public checkAnwsers() {
		if (this.anwsers.length <= 0 || !this.backCtx) return;
		const lines: CheckAnwserItemProps[] = [];

		this.anwsers.forEach(([startId, endId]) => {
			/****************
			 * 找到用户连线的数据
			 ****************/
			// 获取开始元素和目标元素
			const startElement = document.getElementById(startId);
			const endElement = document.getElementById(endId);
			if (startElement && endElement) {
				// 更新选中状态
				startElement.dataset.checked = endElement.dataset.checked = '1';
				// 高亮显示元素
				startElement.classList.add(this.itemActiveCls);
				endElement.classList.add(this.itemActiveCls);
				// 计算坐标
				const { anchorX: x1, anchorY: y1 } = startElement.dataset;
				const { anchorX: x2, anchorY: y2 } = endElement.dataset;
				/****************
				 * 处理纠错逻辑
				 ****************/
				// 找到当前连线数据对应的标准答案
				const standardAnwser = this.standardAnwsers!.find(
					(item) => item[0] === startId
				);
				// 拼装数据
				if (standardAnwser) {
					lines.push({
						point: {
							x1: +(x1 || 0),
							y1: +(y1 || 0),
							x2: +(x2 || 0),
							y2: +(y2 || 0)
						},
						isOk: endId === standardAnwser[1]
					});
				}
			}
		});
		// 绘制模拟连线画板
		this.backCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
		lines.forEach(({ isOk, point: { x1, y1, x2, y2 } }) => {
			this.backCtx!.strokeStyle = isOk ? 'green' : 'red';
			this.backCtx!.beginPath();
			this.backCtx!.moveTo(x1, y1);
			this.backCtx!.lineTo(x2, y2);
			this.backCtx!.stroke();
		});
	}
}
