/**
 * 搜尋演算法測驗 — 成績收集 Apps Script
 *
 * 對應前端 payload 欄位（quiz/quiz_linear.html、quiz/quiz_binary_v3.html 的 submitGS）：
 *   class, seat, name, type, pct, perfect, steps, wrong, skip,
 *   time, tabBlur, detail, stepErrors, attemptId
 *
 * 部署步驟：
 * 1. 開啟 Google 試算表 →「擴充功能」→「Apps Script」
 * 2. 貼上本檔內容，取代原本程式碼
 * 3. 「部署」→「新增部署作業」→ 類型：網路應用程式
 *    - 執行身分：我
 *    - 誰可以存取：所有人
 * 4. 複製網址，貼入測驗頁面的 GAS_URL（以及 teacher.html 的統計網址欄）
 *
 * 特性：
 * - 依 type（測驗類型）自動分頁籤寫入（例如「循序搜尋」「二分搜尋隨堂」）
 * - 以 attemptId 去重：同一份成績重送不會產生重複列
 * - doGet?action=stats：回傳各頁籤聚合統計（teacher.html 儀表板用）
 *
 * 注意：前端送出使用 no-cors，無法讀取回傳內容；
 * 去重與寫入一律在伺服器端完成。
 */

// 固定欄位（第 1 欄為 attemptId，方便去重）
var HEADERS = [
  'attemptId', '送出時間', '班級', '座號', '姓名', '測驗類型',
  '分數', '完美題數', '總步驟', '答錯次數', '跳過', '總時間(秒)',
  '切頁次數', '各步錯誤', '題目明細'
];

function doGet(e) {
  // teacher.html 儀表板：GET 網址 + ?action=stats 回傳聚合統計
  if (e && e.parameter && e.parameter.action === 'stats') {
    return jsonOut(buildStats_());
  }
  return ContentService
    .createTextOutput('搜尋演算法成績收集服務運作中（請用 POST 送出成績）')
    .setMimeType(ContentService.MimeType.TEXT);
}

// 聚合各頁籤統計：每種測驗的人數、平均分、各步錯誤總和、切頁異常名單
function buildStats_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var out = { status: 'ok', updated: new Date(), sheets: [] };
  var sheets = ss.getSheets();
  for (var s = 0; s < sheets.length; s++) {
    var sheet = sheets[s];
    var last = sheet.getLastRow();
    if (last <= 1) continue;
    // 欄位：0 attemptId,1 時間,2 班級,3 座號,4 姓名,5 類型,6 分數,7 完美,8 步驟,9 答錯,10 跳過,11 秒,12 切頁,13 各步錯誤,14 明細
    var rows = sheet.getRange(2, 1, last - 1, 15).getValues();
    var n = 0, sum = 0, stepErr = {}, blurList = [], recent = [];
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (r[0] === '' && r[4] === '') continue;
      n++;
      sum += Number(r[6]) || 0;
      // 各步錯誤格式：「確認L/R:2, 計算mid:0, ...」
      var se = String(r[13] || '');
      se.split(',').forEach(function (pair) {
        var kv = pair.split(':');
        if (kv.length === 2) {
          var k = kv[0].trim();
          stepErr[k] = (stepErr[k] || 0) + (Number(kv[1]) || 0);
        }
      });
      var blur = Number(r[12]) || 0;
      if (blur > 0) blurList.push({ name: String(r[2]) + ' ' + String(r[3]) + '號 ' + String(r[4]), blur: blur });
      if (recent.length < 10) {
        recent.push({ time: r[1], who: String(r[2]) + ' ' + String(r[3]) + '號 ' + String(r[4]), pct: Number(r[6]) || 0 });
      }
    }
    if (n === 0) continue;
    blurList.sort(function (a, b) { return b.blur - a.blur; });
    out.sheets.push({
      type: sheet.getName(), count: n, avg: Math.round(sum / n * 10) / 10,
      stepErrors: stepErr, blurList: blurList.slice(0, 20), recent: recent
    });
  }
  return out;
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonOut({ status: 'error', message: 'empty body' });
    }
    var data = JSON.parse(e.postData.contents);

    // 基本驗證
    var required = ['class', 'seat', 'name', 'type', 'pct'];
    for (var i = 0; i < required.length; i++) {
      if (data[required[i]] === undefined || data[required[i]] === '') {
        return jsonOut({ status: 'error', message: 'missing field: ' + required[i] });
      }
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = getOrCreateSheet_(ss, String(data.type));

    // 去重：同一個 attemptId 只寫一次
    var attemptId = String(data.attemptId || '');
    if (attemptId && hasAttempt_(sheet, attemptId)) {
      return jsonOut({ status: 'dup', message: 'duplicate attemptId, ignored' });
    }

    sheet.appendRow([
      attemptId,
      new Date(),
      String(data.class), String(data.seat), String(data.name), String(data.type),
      Number(data.pct),
      String(data.perfect || ''),
      Number(data.steps || 0), Number(data.wrong || 0), Number(data.skip || 0),
      Number(data.time || 0),
      Number(data.tabBlur || 0),
      String(data.stepErrors || ''),
      String(data.detail || '')
    ]);

    return jsonOut({ status: 'ok' });
  } catch (err) {
    return jsonOut({ status: 'error', message: String(err) });
  }
}

// 依測驗類型取（或建立）工作表；超過 31 字元或非法字元會被清理
function getOrCreateSheet_(ss, type) {
  var name = sanitizeTabName_(type);
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(HEADERS);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
  }
  return sheet;
}

function sanitizeTabName_(name) {
  var clean = String(name).replace(/[\\/?*\[\]:]/g, '').slice(0, 31).trim();
  return clean || '成績';
}

// 檢查 attemptId 是否已存在（只掃第 1 欄；筆數極大時建議改用試算表公式或資料庫）
function hasAttempt_(sheet, attemptId) {
  var last = sheet.getLastRow();
  if (last <= 1) return false;
  var col = sheet.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < col.length; i++) {
    if (String(col[i][0]) === attemptId) return true;
  }
  return false;
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
