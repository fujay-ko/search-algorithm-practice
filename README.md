# 搜尋演算法互動練習

國中資訊課「循序搜尋」與「二分搜尋法」互動練習網頁。

---

## 練習頁面

| 頁面 | 說明 | 適合時機 |
|------|------|----------|
| [循序搜尋練習](practice/linear.html) | 選擇題互動，一格一格比對 | 初學，建立基本概念 |
| [二分搜尋 v1](practice/binary_v1.html) | 選擇題：往左、往右、找到了 | 初學，理解方向判斷 |
| [二分搜尋 v2](practice/binary_v2.html) | 五步填空：確認邊界→計算mid→判斷方向→選邊界→填索引 | 有基礎，驗證理解 |
| [二分搜尋 v3](practice/binary_v3.html) | 填空 + 每步計時 + 錯誤分析 + 步驟重播 | 加深學習，找出弱點 |

---

## 測驗頁面（老師用）

| 頁面 | 說明 |
|------|------|
| [循序搜尋測驗](quiz/quiz_linear.html) | 5題難度分級，成績送 Google Sheet |
| [二分搜尋填空測驗 v2](quiz/quiz_binary_v2.html) | 五步填空，5題，成績送 Google Sheet |
| [二分搜尋填空計時測驗 v3](quiz/quiz_binary_v3.html) | 五步填空＋計時，5題，成績送 Google Sheet |

---

## 測驗設定（老師）

### Google Apps Script 設定步驟

1. 開啟 [Google Sheet](https://sheets.google.com)，建立新的試算表
2. 點上方選單「擴充功能」→「Apps Script」
3. 把 [`gas/gas_script.js`](gas/gas_script.js) 的內容貼上，取代原本內容
4. 點「部署」→「新增部署作業」
   - 類型：**網路應用程式**
   - 執行身分：**我**
   - 誰可以存取：**所有人**
5. 點「部署」，複製產生的網址
6. 把網址貼入每個測驗頁面頂部的 `GAS_URL`：

```javascript
const GAS_URL = '貼上你的網址';
```

---

## 計分說明

### 循序搜尋
- 結果正確（找到 or 確認不存在，無跳過）：**60 分**
- 步驟正確率：**40 分**

### 二分搜尋 v2 / v3
每題共 5 步，各 20 分：

| 步驟 | 滿分 | 第一次答對 | 重試答對 | 跳過 |
|------|------|-----------|---------|------|
| 確認 Left/Right | 20 | 20 | 10 | 0 |
| 計算 mid | 20 | 20 | 10 | 0 |
| 判斷方向 | 20 | 20 | 10 | 0 |
| 選邊界 | 20 | 20 | 10 | 0 |
| 填索引 | 20 | 20 | 10 | 0 |

---

## 難度分級

| 難度 | 陣列大小 | 說明 |
|------|----------|------|
| 🟢 簡單 | 7 格 | 第 1-2 題 |
| 🟡 中等 | 12 格 | 第 3-4 題 |
| 🔴 困難 | 17 格 | 最後 1 題 |

---

## 資料夾結構

```
search-algorithm-practice/
├── README.md
├── index.html              ← 練習頁面入口
├── practice/
│   ├── linear.html
│   ├── binary_v1.html
│   ├── binary_v2.html
│   └── binary_v3.html
├── quiz/
│   ├── quiz_linear.html
│   ├── quiz_binary_v2.html
│   └── quiz_binary_v3.html
└── gas/
    └── gas_script.js
```
