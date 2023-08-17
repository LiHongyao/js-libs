# 概述

由于JavaScript是以64位的浮点数形式存储的，所以在计算过程中会存在较大差异，比如：

```javascript
// 加法
0.1 + 0.2 = 0.30000000000000004

// 减法
1.5 - 1.2 = 0.30000000000000004
0.3 - 0.2 = 0.09999999999999998

// 乘法
19.9 * 100 = 1989.9999999999998
19.9 * 10 * 10 = 1990
1306377.64 * 100 = 130637763.99999999
1306377.64 * 10 * 10 = 130637763.99999999
0.7 * 180 = 125.99999999999999
9.7 * 100 = 969.9999999999999
39.7 * 100 = 3970.0000000000005

// 除法
0.3 / 0.1 = 2.9999999999999996
```

这对于数字敏感型项目是非常致命的，目前有很多处理浮点数计算的库，比如 [bigNumber.js](https://github.com/MikeMcl/bignumber.js/)、[big.js](https://github.com/MikeMcl/big.js/)。为了深入理解其处理方式，这里自己写了一个lg-big库便于自己在项目中使用，分享给大家。

# 使用

1. 加法运算

   ```javascript
   let a = new Big(0.1);
   let b = new Big(0.2);
   console.log(a.plus(b).parse()); // 3
   console.log(a.plus(0.9).parse()); // 1
   ```

2. 减法运算

   ```javascript
   let a = new Big(10);
   let b = new Big(0.1);
   console.log(a.minus(b).parse()); // 9.9
   console.log(a.minus(1).parse()); // 9
   ```

3. 乘法运算

   ```javascript
   let a = new Big(10.9);
   let b = new Big(100);
   console.log(a.multipliedBy(b).parse()); // 1090
   ```

4. 除法运算

   ```javascript
   let a = new Big(0.3);
   let b = new Big(0.1);
   console.log(a.dividedBy(b).parse()); // 3
   ```

5. 固定小数点位数，默认2位

   ```javascript
   let a = new Big(0.3);
   console.log(a.plus(0.1).digits(5)); // 0.40000
   console.log(Big.digits(31)); //  31.00
   console.log(Big.digits(31, 5)); // 31.00000
   console.log(Big.digits(3.1415926, 4)); // 3.1415
   console.log(Big.digits(3.14, 4)); // 3.1400
   ```

6. 人民币格式处理

   ```javascript
   let a = new Big(88.6);
   console.log(a.rmb()); // 88.60
   console.log(a.plus(0.02).rmb()); // 88.62

   console.log(Big.rmb(88)); // 88
   console.log(Big.rmb(88.6)); // 88.60
   console.log(Big.rmb(88.69)); // 88.69
   console.log(Big.rmb(88.69623)); // 88.69
   ```

7. 切割数字，使用场景：UI在设计价格展示时，整数部分和小数部分样式不一致需单独处理时

   ```js
   console.log(new Big(2).plus(1.2).split()); // ['3', '20']
   console.log(Big.split(3.14)); // ['3', '14']
   console.log(Big.split(12.34)); // ['12', '34']
   ```

8. 省略，如果超过1万，则返回万制，转换后小数点后保留两位

   ```js
   console.log(new Big(9999).plus(1000).ellipsis()); // 1.09万
   console.log(Big.ellipsis(13210)); // 1.32万
   ```
