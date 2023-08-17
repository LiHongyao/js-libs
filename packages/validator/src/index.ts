/*
 * @Author: Li-HONGYAO
 * @Date: 2020-11-28 03:43:56
 * @LastEditors: Lee
 * @LastEditTime: 2023-08-17 13:30:35
 * @Description:
 */
class Validator {
	/**
	 * 中文名校验
	 * @param v
	 */
	public static username(v: string) {
		return /^[\u4e00-\u9fa5]{2,6}$/.test(v);
	}
	/**
	 * 身份证校验
	 * @param v
	 */
	public static idCard(v: string) {
		return /(^[1-9]\d{5}(18|19|([23]\d))\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$)|(^[1-9]\d{7}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{3}$)/.test(
			v
		);
	}
	/**
	 * 验证微信号
	 * 1. 可使用6-20个字母、数字、下划线和减号；
	 * 2. 必须以字母开头（字母不区分大小写）；
	 * 3. 不支持设置中文；
	 * @param v
	 */
	public static weChatId(v: string) {
		return /^[a-zA-Z][a-zA-Z\d_-]{5,19}$/.test(v);
	}
	/**
	 * 验证QQ号
	 * @param v
	 */
	public static qq(v: string) {
		return /^\d{5,15}$/.test(v);
	}
	/**
	 * 验证邮箱
	 * @param v
	 */
	public static email(v: string) {
		return /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/.test(v);
	}
	/**
	 * 验证手机号
	 * @param v
	 */
	public static tel(v: string) {
		return /^1[3-9]\d{9}$/.test(v);
	}
	/**
	 * 验证手机验证码
	 * @param v
	 */
	public static code(v: string) {
		return /^\d{6}$/.test(v);
	}
	/**
	 * 验证Android环境
	 */
	public static android() {
		return /Linux|Android/i.test(window.navigator.userAgent);
	}
	/**
	 * 验证iOS环境
	 */
	public static ios() {
		return /iPhone/i.test(window.navigator.userAgent);
	}
	/**
	 * 验证微信环境
	 */
	public static weixin() {
		return /MicroMessenger/i.test(window.navigator.userAgent);
	}
	/**
	 * 验证是否是刘海屏
	 */
	public static bangScreen() {
		return (
			window && window.screen.height >= 812 && window.devicePixelRatio >= 2
		);
	}

	/**
	 * 判断是否是有效日期
	 * @param date
	 * @returns
	 */
	public static isValidDate(date: Date) {
		return date instanceof Date && !isNaN(date.getTime());
	}

	/**
	 * 判断某个日期是否是今日
	 * @param $
	 * @returns
	 */
	public static isToday(v: Date | string | number) {
		const d1 = new Date(v);
		if (Validator.isValidDate(d1)) {
			const d2 = new Date();
			const s1 = `${d1.getFullYear()}${d1.getMonth()}${d1.getDate()}`;
			const s2 = `${d2.getFullYear()}${d2.getMonth()}${d2.getDate()}`;
			return s1 === s2;
		}
		return false;
	}
}

export default Validator;
