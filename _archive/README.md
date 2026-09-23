# _archive（封存區）

此資料夾收錄 2026/09 專案整理時移出的舊版本、備份與實驗頁面，共 39 個檔案。
它們**不再被 `index.html` 引用**，學生/老師請勿直接使用。

- `practice/`：`linear_practice`、`binary_v1`、`binary_v3` 的 `*backup*` 檔
- `quiz/`：`quiz_linear` 的 `.bak*`、`quiz_binary` 的體驗版（experience）、
  `v0~v6`、`batch`、`formal` 及 `quiz_binary_v3_new` 系列

如想救回某個舊版，請先以新檔名複製回原層級，避免覆蓋正式版：

```
search-algorithm-practice/
├── index.html                  ← 練習頁面入口（正式版唯一入口）
├── README.md
├── assets/                     ← favicon 共用資源
├── practice/
│   ├── linear_practice.html    ← 循序搜尋練習（正式版）
│   ├── binary_v1.html          ← 二分搜尋選擇題（正式版）
│   └── binary_v3.html          ← 二分搜尋填空（正式版）
├── quiz/
│   ├── quiz_linear.html        ← 循序搜尋測驗（正式版）
│   └── quiz_binary_v3.html     ← 二分搜尋填空計時測驗（正式版）
├── gas/
│   └── gas_script.js           ← 成績收集 Apps Script（正式版）
└── _archive/                   ← 本資料夾（封存）
```
