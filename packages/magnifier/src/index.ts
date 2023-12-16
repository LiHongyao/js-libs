import './index.css';
import html2canvas from 'html2canvas';

type Size = { width: number; height: number };

export interface MagnifierOptions {
  /** 放大镜初始尺寸，默认值200x200 */
  initialSize?: Size;
  /** 放大镜最小尺寸，默认值500x500 */
  minSize?: Size;
  /** 放大镜最大尺寸，默认值100x100 */
  maxSize?: Size;
  /** 四周触发拖拽缩放的间距，默认值 20 */
  resizeSpacing?: number;
  /** 缩放比例，默认值 1 */
  scaleRatio?: number;
}

export default class Magnifier {
  /** 放大镜初始尺寸，默认值200x200 */
  initialSize: Size;
  /** 放大镜最小尺寸，默认值500x500 */
  minSize: Size;
  /** 放大镜最大尺寸，默认值100x100 */
  maxSize: Size;
  /** 四周触发拖拽缩放的间距，默认值 20 */
  resizeSpacing: number;
  /** 缩放比例，默认值 1 */
  scaleRatio: number;

  /** 类名前缀 */
  prefixCls = 'Lg-magnifier';
  /** 标识当前是否激活缩放状态 */
  isResizing = false;
  /** 标识是否从放大镜【左侧】/【顶部】激活缩放状态，用于判断是否需要更新位置 */
  isResizeTopLeft = false;
  /** 标识当前是否激活拖拽状态 */
  isDragging = false;
  /** 记录放大镜拖拽时的坐标 */
  originalPoint = { x: 0, y: 0 };
  /** 记录放大镜拖拽时的尺寸 */
  originalSize = { width: 0, height: 0 };
  /** 记录放大镜拖拽时的偏移位置 */
  originalOffset = { x: 0, y: 0 };

  /** 容器元素 */
  container: HTMLDivElement | null = null;
  /** 放大镜 */
  magnifier: HTMLDivElement | null = null;
  /** 拖拽区域 */
  dragBox: HTMLDivElement | null = null;
  /** 裁剪区域 */
  cropBox: HTMLDivElement | null = null;
  /** 缩放图片 */
  scaleImg: HTMLImageElement | null = null;
  /** 屏幕截图 */
  canvas: HTMLCanvasElement | null = null;
  /** 屏幕截图上下文 */
  ctx: CanvasRenderingContext2D | null = null;

  /**
   * 构造函数
   * @param {MagnifierOptions} options 可选项
   */
  constructor(options?: MagnifierOptions) {
    // -- 解构配置项
    const {
      initialSize = { width: 200, height: 200 },
      minSize = { width: 100, height: 100 },
      maxSize = { width: 500, height: 500 },
      resizeSpacing = 20,
      scaleRatio = 1.5
    } = options || {};
    // -- 赋值配置项
    this.initialSize = initialSize;
    this.minSize = minSize;
    this.maxSize = maxSize;
    this.resizeSpacing = resizeSpacing;
    this.scaleRatio = scaleRatio;
  }
  /**
   * 挂载放大镜（激活）
   */
  mount = () => {
    // -- 移除容器（避免重复调用挂载函数）
    this.container && this.destroy();
    // -- 禁止页面滚动
    document.body.style.overflow = 'hidden';
    // -- 创建必要元素
    this._createElement();
    // -- 计算放大镜初始位置（屏幕正中间）
    this._calcMagnifierPosition();
    // -- 计算裁剪区域初始位置
    this._calcCropBoxPosition();
    // -- 获取屏幕截图
    this._getScreenshots();
    // -- 更新视图
    this._updateScaleImg();
    // -- 绑定事件（触发开始拖拽/缩放）
    this.dragBox?.addEventListener('mousedown', this._onDragStart);
    this.magnifier?.addEventListener('mousedown', this._onResizeStart);
  };
  /**
   * 销毁放大镜（失活）
   */
  destroy = () => {
    // -- 恢复视窗
    document.body.style.overflow = 'auto';
    // -- 移除事件
    this.dragBox?.removeEventListener('mousedown', this._onDragStart);
    this.magnifier?.removeEventListener('mousedown', this._onResizeStart);
    this.container?.remove();
    // -- 缩放相关
    this.isResizing = false;
    this.isResizeTopLeft = false;
    this.originalPoint = { x: 0, y: 0 };
    this.originalSize = { width: 0, height: 0 };

    // -- 拖拽相关
    this.isDragging = false;
    this.originalOffset = { x: 0, y: 0 };

    // -- 置空元素
    this.container = null;
    this.cropBox = null;
    this.magnifier = null;
    this.dragBox = null;
    this.canvas = null;
    this.scaleImg = null;
  };

  /**
   * 下载屏幕截图（主要用于测试）
   * @param canvas
   */
  _downloadScreenshots = (canvas: HTMLCanvasElement) => {
    const objUrl = canvas.toDataURL('image/jpeg');
    const a = document.createElement('a');
    a.setAttribute('target', '_blank');
    a.setAttribute('href', objUrl);
    a.setAttribute('download', 'IMG__' + Date.now());
    let clickEvent = document.createEvent('MouseEvents');
    clickEvent.initEvent('click', true, true);
    a.dispatchEvent(clickEvent);
  };
  /**
   * 计算裁剪元素区域的位置
   * @returns
   */
  _calcCropBoxPosition = () => {
    if (!this.cropBox) return;
    const rect = this.cropBox.getBoundingClientRect();
    const x = (window.innerWidth - rect.width) / 2;
    const y = (window.innerHeight - rect.height) / 2;
    this.cropBox.style.left = x + 'px';
    this.cropBox.style.top = y + 'px';
  };
  /**
   * 计算放大镜的位置，使其在屏幕正中间
   */
  _calcMagnifierPosition = () => {
    if (!this.magnifier) return;
    const rect = this.magnifier.getBoundingClientRect();
    const x = (window.innerWidth - rect.width) / 2;
    const y = (window.innerHeight - rect.height) / 2;
    this.magnifier.style.left = x + 'px';
    this.magnifier.style.top = y + 'px';
  };
  /**
   * 获取屏幕截图
   * @returns
   */
  _getScreenshots = () => {
    // -- 基于 html2canvas 截取屏幕
    html2canvas(document.body, {
      allowTaint: true,
      backgroundColor: '#FFF',
      scale: this.scaleRatio,
      useCORS: true,
      x: document.documentElement.scrollLeft,
      y: document.documentElement.scrollTop,
      width: window.innerWidth,
      height: window.innerHeight
    }).then(canvas => {
      canvas.classList.add(this.prefixCls + '__canvas');
      this.canvas = canvas;
      this.container?.appendChild(canvas);
      this.ctx = canvas.getContext('2d');
      this._downloadScreenshots(canvas);
    });
  };
  /**
   * 构建必要元素
   */
  _createElement = () => {
    // 1. 创建外层容器
    const container = document.createElement('div');
    container.setAttribute('data-html2canvas-ignore', 'true');
    container.classList.add(this.prefixCls);
    this.container = container;
    // 2. 创建裁剪元素
    const cropBox = document.createElement('div');
    cropBox.style.width = this.initialSize.width / this.scaleRatio + 'px';
    cropBox.style.height = this.initialSize.height / this.scaleRatio + 'px';
    cropBox.classList.add(this.prefixCls + '__cropBox');
    this.cropBox = cropBox;
    // 3. 创建放大镜元素
    const magnifier = document.createElement('div');
    magnifier.style.width = this.initialSize.width + 'px';
    magnifier.style.height = this.initialSize.height + 'px';
    magnifier.classList.add(this.prefixCls + '__magnifier');
    this.magnifier = magnifier;
    // 4. 创建拖拽区域元素
    const dragBox = document.createElement('div');
    dragBox.classList.add(this.prefixCls + '__dragBox');
    dragBox.style.width = 'calc(100% - ' + this.resizeSpacing * 2 + 'px)';
    dragBox.style.height = 'calc(100% - ' + this.resizeSpacing * 2 + 'px)';
    this.dragBox = dragBox;
    // 5. 创建放大图片
    const scaleImg = document.createElement('img');
    scaleImg.classList.add(this.prefixCls + '__scaleImg');
    this.scaleImg = scaleImg;
    // 6. 挂载元素
    magnifier.appendChild(dragBox);
    magnifier.appendChild(scaleImg);
    container.appendChild(magnifier);
    container.appendChild(cropBox);
    document.body.appendChild(container);
  };
  _updateScaleImg = () => {
    if (!this.cropBox || !this.canvas || !this.scaleImg) return;
    const {
      width: cropBoxW,
      height: cropBoxH,
      left: cropBoxOffsetX,
      top: cropBoxOffsetY
    } = this.cropBox.getBoundingClientRect();
    const croppedW = cropBoxW * this.scaleRatio;
    const croppedH = cropBoxH * this.scaleRatio;

    const croppedCanvas = document.createElement('canvas');
    const croppedOffsetX = cropBoxOffsetX * this.scaleRatio;
    const croppedOffsetY = cropBoxOffsetY * this.scaleRatio;
    croppedCanvas.width = croppedW;
    croppedCanvas.height = croppedH;

    const croppedCtx = croppedCanvas.getContext('2d');
    if (!croppedCtx) return;
    croppedCtx.imageSmoothingEnabled = false;
    croppedCtx.drawImage(
      this.canvas,
      croppedOffsetX,
      croppedOffsetY,
      croppedW,
      croppedH,
      0,
      0,
      croppedW,
      croppedH
    );
    const url = croppedCanvas.toDataURL('image/jpeg');
    this.scaleImg.src = url;
  };
  /**
   * 开始拖拽
   * @param {MouseEvent} event
   */
  _onDragStart = (event: MouseEvent) => {
    // -- 阻止事件冒泡
    event.stopPropagation();
    // -- 异常处理
    if (!this.container) return;
    // -- 激活拖拽状态
    this.isDragging = true;
    // -- 监听鼠标事件
    this.container.addEventListener('mousemove', this._onDragging);
    this.container.addEventListener('mouseup', this._onDragEnd);
    this.container.addEventListener('mouseleave', this._onDragEnd);
  };
  _onDragging = (event: MouseEvent) => {
    // -- 阻止事件冒泡
    event.stopPropagation();
    // -- 异常处理
    if (!this.magnifier || !this.cropBox || !this.canvas || !this.scaleImg) return;
    // -- 如果没有激活拖拽状态，不做任何处理
    if (!this.isDragging) return;
    // -- (放大镜）获取当前移动位置
    const { width: magnifierW, height: magnifierH } = this.magnifier.getBoundingClientRect();
    let magnifierOffsetX = event.clientX - magnifierW / 2;
    let magnifierOffsetY = event.clientY - magnifierH / 2;
    // -- (放大镜）获取可移动的最大位置
    const magnifierMaxOffsetX = window.innerWidth - magnifierW;
    const magnifierMaxOffsetY = window.innerHeight - magnifierH;
    // -- (放大镜）处理边界（水平/垂直）
    if (magnifierOffsetX < 0) {
      magnifierOffsetX = 0;
    } else if (magnifierOffsetX > magnifierMaxOffsetX) {
      magnifierOffsetX = magnifierMaxOffsetX;
    }
    if (magnifierOffsetY < 0) {
      magnifierOffsetY = 0;
    } else if (magnifierOffsetY > magnifierMaxOffsetY) {
      magnifierOffsetY = magnifierMaxOffsetY;
    }
    // -- (放大镜）更新放大镜的位置
    this.magnifier.style.left = magnifierOffsetX + 'px';
    this.magnifier.style.top = magnifierOffsetY + 'px';

    // -- (裁剪区域)获取当前移动位置
    const { width: cropBoxW, height: cropBoxH } = this.cropBox.getBoundingClientRect();
    let cropBoxOffsetX = event.clientX - cropBoxW / 2;
    let cropBoxOffsetY = event.clientY - cropBoxH / 2;
    // -- (裁剪区域)获取可移动的最大位置
    const cropBoxMaxOffsetX = window.innerWidth - cropBoxW;
    const cropBoxMaxOffsetY = window.innerHeight - cropBoxH;
    // -- (裁剪区域)处理边界（水平/垂直）
    if (cropBoxOffsetX < 0) {
      cropBoxOffsetX = 0;
    } else if (cropBoxOffsetX > cropBoxMaxOffsetX) {
      cropBoxOffsetX = cropBoxMaxOffsetX;
    }
    if (cropBoxOffsetY < 0) {
      cropBoxOffsetY = 0;
    } else if (cropBoxOffsetY > cropBoxMaxOffsetY) {
      cropBoxOffsetY = cropBoxMaxOffsetY;
    }
    // -- (裁剪区域)
    this.cropBox.style.left = cropBoxOffsetX + 'px';
    this.cropBox.style.top = cropBoxOffsetY + 'px';

    // -- 更新放大镜内容
    this._updateScaleImg();
  };

  /**
   * 拖拽时：鼠标抬起
   * @param {*} event
   */
  _onDragEnd = (event: MouseEvent) => {
    event.stopPropagation();
    this.isDragging = false;
    this.container?.removeEventListener('mousemove', this._onDragging);
    this.container?.removeEventListener('mouseup', this._onDragEnd);
  };
  /**
   * 缩放时：鼠标按下
   * @param {MouseEvent} event
   */
  _onResizeStart = (event: MouseEvent) => {
    if (!this.magnifier) return;
    // -- 阻止事件冒泡
    event.stopPropagation();
    // -- 激活缩放
    this.isResizing = true;
    // -- 记录鼠标按下时的位置
    this.originalPoint = { x: event.clientX, y: event.clientY };
    // -- 记录放大镜尺寸
    const rect = this.magnifier.getBoundingClientRect();
    this.originalSize = { width: rect.width, height: rect.height };

    // 记录鼠标按下时放大镜距离屏幕左上角的位置
    this.originalOffset = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
    // 判断是否触发向上/向左缩放
    if (
      this.originalOffset.x <= this.resizeSpacing ||
      this.originalOffset.y <= this.resizeSpacing
    ) {
      this.isResizeTopLeft = true;
    } else {
      this.isResizeTopLeft = false;
    }

    this.container?.addEventListener('mousemove', this._onResizing);
    this.container?.addEventListener('mouseup', this._onReszieEnd);
    this.container?.addEventListener('mouseleave', this._onReszieEnd);
  };
  /**
   * 缩放时：鼠标移动
   * @param {MouseEvent} event
   * @returns
   */
  _onResizing = (event: MouseEvent) => {
    if (!this.magnifier || !this.cropBox || !this.canvas || !this.scaleImg) return;
    // -- 阻止事件冒泡
    event.stopPropagation();
    // -- 如果没有激活缩放状态，不做任何处理
    if (!this.isResizing) return;
    // -- 获取鼠标相对于原点拖拽的距离
    const deltaX = event.clientX - this.originalPoint.x;
    const deltaY = event.clientY - this.originalPoint.y;
    // -- 计算目标尺寸
    let targetWidth = 0;
    let targetHeight = 0;
    if (this.isResizeTopLeft) {
      targetWidth = this.originalSize.width - deltaX;
      targetHeight = this.originalSize.height - deltaY;
    } else {
      targetWidth = this.originalSize.width + deltaX;
      targetHeight = this.originalSize.height + deltaY;
    }
    // -- 边界值处理（判断当前放大镜是否缩放到最大/小尺寸）
    if (targetWidth < this.minSize.width || targetHeight < this.minSize.height) {
      this._onReszieEnd();
      return;
    }
    if (targetWidth > this.maxSize.width || targetHeight > this.maxSize.height) {
      this._onReszieEnd();
      return;
    }
    // -- 如果是从顶部/左侧缩放，则需动态更新放大镜在屏幕的位置
    if (this.isResizeTopLeft) {
      let x = event.clientX - this.originalOffset.x;
      let y = event.clientY - this.originalOffset.y;
      this.magnifier.style.left = x + 'px';
      this.magnifier.style.top = y + 'px';
    }
    // -- 更新放大镜尺寸
    this.magnifier.style.width = targetWidth + 'px';
    this.magnifier.style.height = targetHeight + 'px';

    // -- 更新裁剪区域的尺寸和位置
    const cropBoxW = targetWidth / this.scaleRatio;
    const cropBoxH = targetHeight / this.scaleRatio;
    this.cropBox.style.width = cropBoxW + 'px';
    this.cropBox.style.height = cropBoxH + 'px';
    const { top, left, width, height } = this.magnifier.getBoundingClientRect();
    const cropBoxOffsetX = left + width / 2 - cropBoxW / 2;
    const cropBoxOffsetY = top + height / 2 - cropBoxH / 2;
    this.cropBox.style.left = cropBoxOffsetX + 'px';
    this.cropBox.style.top = cropBoxOffsetY + 'px';

    // -- 更新
    this._updateScaleImg();
  };
  /**
   * 缩放时：鼠标抬起
   */
  _onReszieEnd = () => {
    this.isResizing = false;
    this.container?.removeEventListener('mousemove', this._onResizing);
    this.container?.removeEventListener('mouseup', this._onReszieEnd);
    this.container?.removeEventListener('mouseleave', this._onReszieEnd);
  };
}
