/*
 * @Author: Lee
 * @Date: 2023-08-17 13:22:12
 * @LastEditors: Lee
 * @LastEditTime: 2023-08-17 13:24:01
 * @Description:
 */
type FunctionType = (...args: any[]) => void;

class EventBus {
	// 属性
	private bus: Record<string, FunctionType[]> = {};
	// 构造单例
	private static instance: EventBus;
	private constructor() {}
	static defaultUtils() {
		if (!this.instance) {
			this.instance = new EventBus();
		}
		return this.instance;
	}

	/**
	 * 监听事件
	 * @param event 事件名称
	 * @param handler 事件处理函数
	 */
	public $on(event: string, handler: FunctionType) {
		if (!this.bus[event]) {
			this.bus[event] = [];
		}
		this.bus[event].push(handler);
	}
	/**
	 * 触发事件
	 * @param event 事件名称
	 * @param args 参数
	 */
	public $emit(event: string, ...args: any) {
		const handlers = this.bus[event];
		if (handlers) {
			for (const handler of handlers) {
				handler.call(this, ...args);
			}
		}
	}
	/**
	 * 移除事件
	 * @param event 事件名称
	 * @param handler 事件处理函数
	 */
	public $off(event: string, handler?: FunctionType) {
		const handlers = this.bus[event];
		if (handlers) {
			if (!handler) {
				delete this.bus[event];
			} else {
				handlers.forEach((item, index) => {
					if (item === handler) {
						handlers.splice(index, 1);
					}
				});
			}
		}
	}
}

const Bus = EventBus.defaultUtils();
export default Bus;
