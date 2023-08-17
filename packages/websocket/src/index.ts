export interface KWebSocketOptions {
	/** 是否启用调试模式，默认值：false */
	debug?: boolean;
	/** 连接地址，格式一般为：ws[s]://SERVER_HOST[/path][?query] */
	url: string;
	/** 最大重连次数，默认值：5 */
	maxReconnectTimes?: number;
	/** 重连间隔，单位（毫秒），默认值：10 * 1000 */
	reconnectInterval?: number;
	/** 心跳间隔，单位（毫秒），默认值：10 * 1000 */
	heartInterval?: number;
	/** 心跳描述字符串，默认值：heartbeat */
	heartString?: string;
	/** 连接成功回调/触发时机：首次连接成功和断线重新连接后，（防止断线期间对方发送消息未接收到）一般用于请求历史消息列表 */
	onConnected: () => void;
	/** 收到服务器消息回调 */
	onMessage: (message: string) => void;
}

export interface KWebSocketProps {
	send: <T>(data: T) => void;
	close: () => void;
}

export default class KWebSocket {
	// -- 配置项
	private options: Required<KWebSocketOptions>;
	// -- WebScoket实例
	private socket: WebSocket | null = null;
	// -- 标识是否正常关闭
	private normalCloseFlag = false;
	// -- 重新连接次数
	private reconnectTimes = 1;
	// -- 重连定时器Timer
	private reconnectTimer: number | null = null;
	// -- 心跳定时器Timer
	private heartbeatTimer: number | null = null;

	// -- 构造函数
	constructor(options: KWebSocketOptions) {
		// 1. 默认配置
		const defaultOptions = {
			debug: false,
			maxReconnectTimes: 5,
			reconnectInterval: 10 * 1000,
			heartInterval: 10 * 1000,
			heartString: 'heartbeat'
		};
		// 2. 合并配置
		this.options = Object.assign({}, defaultOptions, options);
		// 3. 初始化
		this.init();
	}
	/**
	 * 初始化 & 监听
	 */
	private init() {
		// 1. 创建WebSocket连接
		this.socket = new WebSocket(this.options.url);
		// 2. 监听
		this.watch();
	}

	private watch() {
		// 1. 判断socket实例是否存在
		if (!this.socket) return;
		// 2. 监听WebSocket连接打开事件
		this.socket.onopen = () => {
			this.options.debug && console.log('WebSocket：链接打开');
			// -- 连接成功
			this.options.onConnected();
			// -- 重置连接次数
			this.reconnectTimes = 1;
			// -- 发送心跳
			this.sendHeartbeat();
		};

		// 3. 监听WebSocket接收到服务器发送的消息
		this.socket.onmessage = (event) => {
			if (event.data !== this.options.heartString) {
				this.options.debug &&
					console.log('WebSocket：接收到消息 → ', event.data);
				this.options.onMessage(event.data);
			}
		};

		// 4.监听WebSocket断开事件
		this.socket.onclose = () => {
			if (!this.normalCloseFlag) {
				// -- 关闭心跳
				if (this.heartbeatTimer) {
					clearInterval(this.heartbeatTimer);
					this.heartbeatTimer = null;
				}
				// -- 触发重连
				this.reconnect();
			} else {
				this.options.debug && console.log('WebSocket：正常关闭');
			}
		};
	}

	/**
	 * 外部调用：关闭连接
	 */
	public close() {
		// 1. 正常关闭状态
		this.normalCloseFlag = true;
		// 2. 关闭WebSocket
		this.socket?.close();
		// 3. 关闭心跳定时器
		if (this.heartbeatTimer) {
			clearInterval(this.heartbeatTimer);
			this.heartbeatTimer = null;
		}
		// 4. 关闭重连定时器
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}
	}

	/**
	 * 发送消息
	 * @param data
	 */
	public send<T = any>(data: T) {
		this.socket?.send(JSON.stringify(data));
		this.options.debug && console.log('WebSocket：消息已发送');
	}

	/**
	 * 发送心跳
	 */
	private sendHeartbeat() {
		// 1. 进入该方法立即发送一次心跳
		this.socket?.send(this.options.heartString);
		this.options.debug && console.log('WebSocket：💓');

		// 2. 间隔发送心跳
		this.heartbeatTimer = setInterval(() => {
			this.socket?.send(this.options.heartString);
			this.options.debug && this.options.debug && console.log('WebSocket：💓');
		}, this.options.heartInterval);
	}

	/**
	 * 断开重连
	 */
	private reconnect() {
		// -- 清除重连定时器
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}
		// -- 校验重连次数
		if (this.reconnectTimes <= this.options.maxReconnectTimes) {
			this.reconnectTimer = setTimeout(() => {
				this.options.debug &&
					console.log(`Websocket：第${this.reconnectTimes}次重连...`);
				this.init();
				this.reconnectTimes++;
			}, this.options.reconnectInterval);
		} else {
			this.options.debug && console.log('WebSocket：重连失败');
		}
	}
}
