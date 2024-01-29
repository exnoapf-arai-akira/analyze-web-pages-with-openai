function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    console.log('Text successfully copied to clipboard');
    const copyStatus = document.getElementById('copyStatus');
    copyStatus.textContent = 'Copied';
    // Optionally, reset the button's text after some time
    setTimeout(() => {
      copyStatus.textContent = 'Copy code';
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy text to clipboard', err);
  });
}

// APIトークンとエンドポイントURLのオプションを保存
function saveOptions() {
  var apiToken = document.getElementById('apiToken').value;
  var endpointUrl = document.getElementById('endpointUrl').value;

  // スプレッドシートとGASデプロイURLのペアを取得
  var urlPairs = [];
  var listItems = document.querySelectorAll('#urlsList li');
  listItems.forEach(function (item) {
    var pairParts = item.textContent.split(', ');
    var spreadsheetIdPart = pairParts[0];
    var gasDeployUrlPart = pairParts[1];

    urlPairs.push({
      spreadsheetId: spreadsheetIdPart.replace('スプレッドシートID: ', ''),
      gasDeployUrl: gasDeployUrlPart.replace('GASデプロイURL: ', '')
    });
  });

  chrome.storage.sync.set({
    apiToken: apiToken,
    endpointUrl: endpointUrl,
    urlPairs: urlPairs
  }, function() {
    console.log('設定が保存されました。');
  });
}

// 保存されたオプションを復元
function restoreOptions() {
  chrome.storage.sync.get({
    apiToken: '',
    endpointUrl: '',
    urlPairs: []
  }, function(items) {
    document.getElementById('apiToken').value = items.apiToken;
    document.getElementById('endpointUrl').value = items.endpointUrl;
    restoreUrlPairs(items.urlPairs);
  });
}

// 保存されたスプレッドシートIDとGASデプロイURLのペアをリストに表示
//function restoreUrlPairs(urlPairs) {
//  var listElement = document.getElementById("urlsList");
//  urlPairs.forEach(function(pair) {
//    var li = document.createElement("li");
//    li.textContent = `スプレッドシートID: ${pair.spreadsheetId}, GASデプロイURL: ${pair.gasDeployUrl}`;
//    listElement.appendChild(li);
//  });
//}
function restoreUrlPairs(urlPairs) {
  var listElement = document.getElementById("urlsList");
  urlPairs.forEach(function(pair) {
    var li = document.createElement("li");
    li.className = 'url-item'; // 追加したCSSのクラスを適用する
    li.innerHTML = `
      <span class="url-label">スプレッドシートID:</span>
      <span class="url-value">${pair.spreadsheetId}</span><br>
      <span class="url-label">GASデプロイURL:</span>
      <span class="url-value">
        <a href="${pair.gasDeployUrl}" target="_blank">${pair.gasDeployUrl}</a>
      </span>
    `;
    listElement.appendChild(li);
  });
}

// 新しいペアを追加
function addNewUrlPair() {
  var spreadsheetIdInput = document.getElementById("newSpreadsheetId");
  var gasDeployUrlInput = document.getElementById("newGasDeployUrl");
  var spreadsheetId = spreadsheetIdInput.value.trim();
  var gasDeployUrl = gasDeployUrlInput.value.trim();

  if (spreadsheetId && gasDeployUrl) {
    var listElement = document.getElementById("urlsList");
    var li = document.createElement("li");
    li.textContent = `スプレッドシートID: ${spreadsheetId}, GASデプロイURL: ${gasDeployUrl}`;
    listElement.appendChild(li);

    spreadsheetIdInput.value = '';
    gasDeployUrlInput.value = '';

    saveOptions(); // 新しいペアを保存
  } else {
    alert("スプレッドシートIDとGASデプロイURLの両方が必要です。");
  }
}

// 初期化処理
document.addEventListener('DOMContentLoaded', function() {
  restoreOptions();
  document.getElementById('options-form').addEventListener('submit', function(event) {
    event.preventDefault();
    saveOptions();
  });
  document.getElementById('addUrlPair').addEventListener('click', addNewUrlPair);
  document.getElementById('togglePassword').addEventListener('click', togglePasswordVisibility);

  const copyButton = document.getElementById('copyStatus'); 
  if (copyButton) {
    copyButton.addEventListener('click', function() {
      const codeToCopy = document.querySelector('.code-block code').textContent;
      copyToClipboard(codeToCopy);
    });
  }

});

// パスワードの表示・非表示を切り替える
function togglePasswordVisibility() {
  var apiToken = document.getElementById('apiToken');
  var togglePassword = document.getElementById('togglePassword');
  if (apiToken.type === "password") {
    apiToken.type = "text";
    togglePassword.textContent = "隠す";
  } else {
    apiToken.type = "password";
    togglePassword.textContent = "表示";
  }
}
