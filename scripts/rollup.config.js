/*
 * @Author: Lee
 * @Date: 2023-08-14 18:03:12
 * @LastEditors: Lee
 * @LastEditTime: 2023-08-17 21:08:06
 * @Description:
 */

import { defineConfig } from 'rollup';
import { generateRollupConfig, getPkgNames } from './utils';

const libs = [];
const rollupConfigs = [];

const pkgNames = libs.length ? libs : getPkgNames();

pkgNames.forEach((pkgName) => {
	const pkgConfig = generateRollupConfig(pkgName);
	rollupConfigs.push(pkgConfig);
});

export default defineConfig(rollupConfigs);
