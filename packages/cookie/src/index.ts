/*
 * @Author: Lee
 * @Date: 2023-08-17 09:31:14
 * @LastEditors: Lee
 * @LastEditTime: 2023-08-17 19:56:13
 * @Description:
 */
class Cookie {
	/**
	 * 添加/修改cookie
	 * @param {string} key 键
	 * @param {string} value 值
	 * @param {number} expireDays 过期时间
	 */
	public static set(key: string, value: string | number, expireDays = 1) {
		if (['string', 'number'].indexOf(typeof value) === -1) {
			return;
		}
		document.cookie = `${key}=${encodeURIComponent(value)};expires=${new Date(
			new Date().getTime() + expireDays * 24 * 60 * 60 * 1000
		).toString()};path=/;`;
	}
	/**
	 * 读取cookie，如果key存在，则查询指定key所对应的cookie值，否则返回所有cookie值
	 * @param {string} key 键
	 */
	public static get<T>(key?: string) {
		if (document.cookie) {
			const pairs = document.cookie.split(';');
			const result: Record<string, string> = {};
			pairs.forEach((str) => {
				const arr = str.trim().split('=');
				const ikey = String(decodeURIComponent(arr[0]));
				const ivalue = String(decodeURIComponent(arr[1]));
				result[ikey] = ivalue;
			});
			const res: unknown = key ? (result[key] ? result[key] : '') : result;
			return res as T;
		} else {
			const res: unknown = key ? '' : {};
			return res as T;
		}
	}
	/**
	 * 删除cookie，如果key属性存在，则删除指定key对应的cookie值，否则清空cookie
	 * @param {string} key 键
	 */
	public static del(key?: string | string[]) {
		const expires = new Date(0);
		const type = Object.prototype.toString.call(key).slice(8, -1).toLowerCase();
		if (key) {
			if (type === 'string') {
				// 删除指定cookie
				document.cookie = `${key}=0;expires=${expires.toUTCString()};path=/`;
			} else if (type === 'array') {
				// 批量删除
				const keys = key as string[];
				keys.forEach((_key) => {
					document.cookie = `${_key}=0;expires=${expires.toUTCString()};path=/`;
				});
			}
		} else {
			// 清空所有cookie
			const keys = document.cookie.match(/[^ =;]+(?==)/g);
			if (keys) {
				keys.forEach((_key) => {
					document.cookie = `${_key}=0;expires=${expires.toUTCString()};path=/`;
				});
			}
		}
	}
}

export default Cookie;
