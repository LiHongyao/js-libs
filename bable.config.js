/*
 * @Author: Lee
 * @Date: 2023-08-16 18:59:05
 * @LastEditors: Lee
 * @LastEditTime: 2023-08-16 18:59:16
 * @Description:
 */
export default {
	presets: [
		[
			'@babel/preset-env',
			{
				useBuiltIns: 'usage',
				corejs: 3,
				modules: false
			}
		],
		'@babel/preset-typescript'
	]
};
