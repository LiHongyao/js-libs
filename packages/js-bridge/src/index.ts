declare global {
	interface Window {
		webkit: any;
		js_android: any;
	}
}
type PromptType = {
	type: string;
	[propName: string]: any;
};

class JSBridge {
	/**
	 * 获取当前环境
	 * @returns
	 */
	private static getEnv() {
		const ua = window.navigator.userAgent;
		if (/MicroMessenger/i.test(ua)) {
			return 'weixin';
		} else if (/Linux|Android/i.test(ua)) {
			return 'android';
		} else if (/iPhone/i.test(ua)) {
			return 'ios';
		} else {
			return 'unknown';
		}
	}

	public static jsTest(options: any) {
		console.log('__jsTest__');
		JSBridge.call({
			fn: 'jsTest',
			data: options
		});
	}

	/**
	 * 调用原生方法通信
	 * @param options
	 * options.fn 原生方法名
	 * options.data H5传递给原生的参数/如果没有则传递null
	 * options.iOSPrompt 处理iOS同步返回
	 */
	private static call(options: {
		fn: string;
		data?: any;
		iOSPrompt?: PromptType;
	}) {
		// 1. 获取传递参数
		let payload = options.data;
		// 2. 如果没有值，则赋值为null
		if (options.data === undefined) {
			payload = null;
		}
		// 3. 如果参数为对象，则转成JSON字符串
		if (typeof options.data === 'object') {
			payload = JSON.stringify(options.data);
		}
		// 4. 根据环境执行
		const env = JSBridge.getEnv();
		if (env === 'ios') {
			try {
				if (options.iOSPrompt) {
					return prompt(JSON.stringify(options.iOSPrompt));
				} else {
					return window.webkit.messageHandlers[options.fn].postMessage(payload);
				}
			} catch (err) {
				console.log(err);
			}
		} else if (env === 'android') {
			try {
				return window.js_android[options.fn](payload);
			} catch (err) {
				console.log(err);
			}
		} else {
			console.log('JSBridge仅支持在iOS或安卓环境下使用');
		}
	}

	/************************************************
	 ****** APIs
	 ************************************************/

	/**
	 * 1. 跳转微信小程序
	 * @param {*} options
	 */
	public static launchMiniProgram(options: {
		userName: string /** 小程序原始id */;
		path: string /** 拉起小程序页面的可带参路径，不填默认拉起小程序首页 */;
		miniprogramType: 0 | 1 | 2 /** 打开类型；0：正式版，1：开发版，2：体验版 */;
	}) {
		JSBridge.call({
			fn: 'launchMiniProgram',
			data: options
		});
	}

	/**
	 * 2. H5调用原生支付
	 */
	public static payment(params: {
		callback: string /** 支付回调H5函数名 */;
		payType: string /** 支付类型（这里需要和原生约定类型，如：微信支付 - WX_PAY，支付宝支付 - ALI_PAY，苹果支付 - APPLE_PAY） */;
		payStr: string /** 支付参数（这里需要和后台沟通，将原生拉起支付的参数以JSON字符串形式返回，到时直接传递给原生并由原生解析即可） */;
		orderNo?: string /** 订单号（有时原生调用支付回调函数之后，H5这边需要通过订单号查询支付状态，所以这里将订单号传给原生，原生在回调时作为参数回传给H5使用） */;
	}) {
		JSBridge.call({
			fn: 'payment',
			data: params
		});
	}

	/**
	 * 3. H5调用原生分享
	 */
	public static shareWith(options: {
		type: number /** 分享类型： 0 文字 / 1 图片 / 2 网页链接 / 3 视频连接 / 4 小程序 */;
		title?: string /** 标题（可选） */;
		link?: string /** 网页链接（可选） */;
		text?: string /** 文字内容/网页链接描述（可选） */;
		videoUrl?: string /** 视频连接地址（可选） */;
		imageUrl?: string /** 图片链接地址/网页链接缩略图（可选） */;
		imageBase64?: string /** 图片base64（可选） */;
	}) {
		JSBridge.call({
			fn: 'shareWith',
			data: options
		});
	}

	/**
	 * 4. 保存图片至手机相册
	 * @param images 图片集合/这里将图片的在线链接放入集合传递给原生进行保存
	 */
	public static saveImages(images: string[]) {
		JSBridge.call({
			fn: 'saveImages',
			data: images
		});
	}

	/**
	 * 5. 保存视频至手机相册
	 * @param {string} videoUrls 视频地址集合/这里将视频的在线链接放入集合传递给原生进行保存
	 */
	public static saveVideos(videoUrls: string[]) {
		JSBridge.call({
			fn: 'saveVideos',
			data: videoUrls
		});
	}

	/**
	 * 6. 通知原生返回上一页（原生pop控制器）
	 */
	public static nativeBack() {
		JSBridge.call({
			fn: 'nativeBack'
		});
	}

	/**
	 * 7. 通知原生绑定平台
	 * @param options
	 * @param options.platform 平台：WX/ALIPAY
	 * @param options.callback 微信绑定之后的回调函数
	 */
	public static bindPlatform(options: {
		platform: 'WX' | 'ALIPAY';
		callback: string;
	}) {
		JSBridge.call({
			fn: 'bindPlatform',
			data: options
		});
	}

	/**
	 * 8. 通知原生打开APP
	 * @param appTag APP标识
	 */
	public static openApp(appTag: 'WX' | 'QQ') {
		JSBridge.call({
			fn: 'openApp',
			data: appTag
		});
	}

	/**
	 * 9. 通知原生定位
	 * @param callback 原生定位成功以后调用H5回调函数，并将定位信息作为回调函数参数传递。
	 */
	public static getLocation(callback: string) {
		JSBridge.call({
			fn: 'getLocation',
			data: { callback }
		});
	}

	/**
	 * 10. 从原生获取token。
	 *
	 * iOS开发者注意：----- 此方法通过prompt触发，type类型为：GET_TOKEN
	 */
	public static getToken() {
		const token = JSBridge.call({
			fn: 'getToken',
			iOSPrompt: { type: 'GET_TOKEN' }
		});
		return token ? (token as string) : '';
	}

	/**
	 * 11. 分享（邀请）海报 --- 裂变
	 * @param options
	 * @param options.type  -- 分享（邀请）标识符，H5和原生根据具体使用场景自行约定一个字符串常量标识；
	 * @param options.callback -- H5回调函数名，原生在成功触发邀请之后调用该js函数，用于通知H5做后续处理；
	 */
	public static sharePoster(options: { type: string; callback: string }) {
		JSBridge.call({
			fn: 'sharePoster',
			data: options
		});
	}

	/**
	 * 12. 设置剪切板
	 * @param value 复制内容
	 */
	public static setClipboard(value: string) {
		JSBridge.call({
			fn: 'setClipboard',
			data: value
		});
	}

	/**
	 * 13. 获取剪切板内容
	 * @returns value
	 */
	public static getClipboard() {
		const value = JSBridge.call({
			fn: 'getClipboard',
			iOSPrompt: { type: 'clipboard' }
		});
		return value ? (value as string) : '';
	}

	/**
	 * 14. 百度统计
	 * @param eventId 事件ID
	 */
	public static baiduStatistics(eventId: string) {
		JSBridge.call({
			fn: 'baiduStatistics',
			data: eventId
		});
	}

	/**
	 * 15. 通知原生刷新页面
	 * @param k 通知标识，可以理解为事件名称，需原生和H5协商
	 */
	public static nativeRefresh(k: string) {
		JSBridge.call({
			fn: 'nativeRefresh',
			data: k
		});
	}
}

export default JSBridge;
