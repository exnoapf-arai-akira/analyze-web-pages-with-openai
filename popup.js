// popup.js
document.addEventListener('DOMContentLoaded', function() {
  var analyzeButton = document.getElementById('analyzeButton');
  var inputText = document.getElementById('inputText');
  var sheetNameSelect = document.getElementById('sheetNameSelect');
  var responseArea = document.getElementById('responseArea');
  var tabUrl;
  var endpointUrl;
  var apiToken

  chrome.storage.sync.get({
    apiToken: '',
    endpointUrl: ''
  }, function(items) {
    var mainContent = document.getElementById('mainContent');
    var settingsLink = document.getElementById('settingsLink');

    if (!items.apiToken || !items.endpointUrl) {
      // 設定がない場合のみ設定リンクを表示
      settingsLink.style.display = 'block';
    } else {
      // 設定がある場合はメインコンテンツを表示
      mainContent.style.display = 'block';
    }
  });
  
  // タブごとの固有の識別子を取得
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    var currentTab = tabs[0];
    tabUrl = currentTab.url;
    restoreState();
  
    // 保存したいタイミングで状態を保存する関数
    function saveState() {
      localStorage.setItem(`inputText_${tabUrl}`, inputText.value);
      localStorage.setItem(`sheetName_${tabUrl}`, sheetNameSelect.value);
      localStorage.setItem(`responseArea_${tabUrl}`, responseArea.innerHTML);
    }

    // ボタンクリック時に状態を保存
    analyzeButton.addEventListener('click', function() {
      // アクティブなタブのURLを使用して保存
      saveState();
      // 以下は既存のクリックイベントのコード...
    });
  
    // 保存された状態を復元する関数
    function restoreState() {
      // タブのURLをキーとして使用して保存された状態を復元
      var savedInputText = localStorage.getItem(`inputText_${tabUrl}`);
      if (savedInputText) {
        inputText.value = savedInputText;
      }
  
      var savedSheetName = localStorage.getItem(`sheetName_${tabUrl}`);
      if (savedSheetName) {
        sheetNameSelect.value = savedSheetName;
      }
  
      var savedResponse = localStorage.getItem(`responseArea_${tabUrl}`);
      if (savedResponse) {
        responseArea.innerHTML = savedResponse;
      }
    }

    // ページ読み込み時に保存された状態を復元
    restoreState();
  });

  // Google SheetsのURLかどうかを判定する関数
  function isFromGoogleSheets(url) {
      if (url.includes('https://docs.google.com/spreadsheets/')) {
          return true;
      } else {
          return false;
      }
  }

  function gasSelect(url, sheetName, callback) {
    chrome.storage.sync.get({ urlPairs: [] }, function(items) {
      var matchingPair = items.urlPairs.find(function(pair) {
        return url.includes(pair.spreadsheetId);
      });
      //console.log(matchingPair);
      if (!matchingPair) {
        console.log("スプレッドシートの登録がありません。");
        callback(null); // エラー時はnullを渡す
      } else {
        var appsScriptUrl = `${matchingPair.gasDeployUrl}?sheet=${sheetName}`;
        console.log(appsScriptUrl);
        callback(appsScriptUrl); // 成功時はURLを渡す
        //return appsScriptUrl;
      }
    });
  }


    function formatAnalysisContent(data) {
        // ここに分析内容に応じて整形する処理を記述
        var formattedContent = '<div class="summary-title">データ分析の要約:</div>';
        formattedContent += '<p>' + data.replace(/\n/g, '</p><p>').replace(/(AWSアカウントID|管理者|担当部署)/g, '<span class="key-info">$1</span>') + '</p>';
        return formattedContent;
    }

    // ボタンクリック時の処理
    analyzeButton.addEventListener('click', function() {
  	chrome.storage.sync.get({
            apiToken: '',
            endpointUrl: ''
          }, function(items) {
            if (!items.apiToken || !items.endpointUrl) {
              var responseArea = document.getElementById('responseArea');
              responseArea.textContent = 'APIトークンとエンドポイントURLが設定されていません。拡張機能のオプションページで設定してください。';
              return;
            } else {
              apiToken = items.apiToken;
              endpointUrl = items.endpointUrl;
              console.log('APIトークン: ' + items.apiToken);
              console.log('エンドポイントURL: ' + items.endpointUrl);
            }
        });
        // アクティブなタブのURLを取得
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            var currentUrl = tabs[0].url;
            tabUrl = currentUrl;
            if (isFromGoogleSheets(currentUrl)) {
                var sheetName = sheetNameSelect.value;
                //console.log(currentUrl);
                //console.log(sheetName);
                //appsScriptUrl = gasSelect(currentUrl, sheetName);

		gasSelect(currentUrl, sheetName, function(appsScriptUrl) {
		  if (appsScriptUrl) {
		    console.log(appsScriptUrl);
                    if (!inputText.value || !sheetName) {
                        console.error("テキストまたはシート名が入力されていません。");
                        responseArea.innerText = "テキストまたはシート名が入力されていません。";
                        return;
                    }
                    fetch(appsScriptUrl)
                    .then(response => response.json())
                    .then(data => {
                        //console.log(data);
                        try {
                          //var spreadsheetData = JSON.parse(data);
                          var concatenatedString = data.join(", ");
                          var spreadsheetData = concatenatedString;
                          sendToOpenAI_SP(inputText.value, spreadsheetData);
                        } catch (error) {
                          console.error("JSON形式にパースできませんでした:", error);
                          responseArea.innerHTML = "JSON形式にパースできませんでした: " + error; // エラーメッセージ表示
                        }
                    })
                    .catch(error => {
                        console.error("Google Apps Scriptからのデータ取得エラー:", error);
                        responseArea.innerHTML = "Google Apps Scriptからのデータ取得エラー: " + error; // エラーメッセージ表示
                    });
		  } else {
		    console.log("こちらのスプレッドシートは未対応です");
                    responseArea.innerHTML = `
<p>こちらのスプレッドシートは未対応です。解析が必要でしたら<a href="options.html" target="_blank">オプション</a>にて追加をお願いします。
また、追加するスプレッドシートにもGASのスクリプトを設置してデプロイ＆権限設定が必要となります。</p>
<p>GASのコードはこちらです。</p>
  <pre class="code-block"><code>
function getDataFromSheet(sheetName) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  var data = sheet.getDataRange().getValues();
  return data;
}

function constructJSONResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var sheetName = e.parameter.sheet;
  var data = getDataFromSheet(sheetName);
  return constructJSONResponse(data);
}
  </code></pre>
</div>
`;
		  }
		});
            } else {
                // 通常の方法でアクティブなブラウザtabからテキスト抽出
                chrome.tabs.sendMessage(tabs[0].id, {action: "getPageData"}, function(response) {
                    if (!inputText.value) {
                        console.error("テキストが入力されていません。");
                        responseArea.innerText = "テキストが入力されていません。";
                        return;
                    }
                    if (response && response.data) {
                        var pageData = response.data;
                        sendToOpenAI(inputText.value, pageData);
                    } else {
                        if (chrome.runtime.lastError) {
                            console.error("メッセージ送信時にエラーが発生しました:", JSON.stringify(chrome.runtime.lastError, null, 2));
                            responseArea.innerText = "メッセージ送信時にエラーが発生しました:" + JSON.stringify(chrome.runtime.lastError, null, 2); // エラーメッセージ表示
                        } else {
                            console.error("アクティブページのデータ取得に失敗しました。");
                            responseArea.innerText = "アクティブページのデータ取得に失敗しました。"; // エラーメッセージ表示
                        }
                    }
                });
            }
        });
    });

    function sendToOpenAI(userInput, pageData) {
        // Azure OpenAI APIのエンドポイント
        const openAIEndpoint = endpointUrl;
        const api_key = apiToken;
        var payload = {
            messages: [
                { role: 'system', content: userInput },
                { role: 'user', content: `Page Title: ${pageData.title}, URL: ${pageData.url}, Data: ${pageData.content}` }
            ]
        };
        //console.log("送信されるプロンプト:", JSON.stringify(payload));
        //console.log("送信されるプロンプト2:", JSON.stringify(payload.messages[1].content));
        // OpenAI APIへのリクエストを送信します
        fetch(openAIEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': api_key
            },
            body: JSON.stringify(payload)
        })
        .then(response => response.json()) // 返答をJSONとしてパースする追加ステップ
        .then(data => {
            console.log("OpenAIからの応答:", data);
            var contentText = data.choices[0].message.content;
            var formattedContent = contentText.replace(/\n/g, '<br>');
            responseArea.innerHTML = formatAnalysisContent(formattedContent);
            localStorage.setItem(`responseArea_${tabUrl}`, responseArea.innerHTML);
        })
        .catch(error => {
            console.error("OpenAI APIエラー:", error);
            responseArea.innerHTML = "OpenAI APIエラー: " + error; // エラーメッセージ表示
        });
    }

    function sendToOpenAI_SP(userInput, spreadsheetData) {
        // Azure OpenAI APIのエンドポイント
        const openAIEndpoint = endpointUrl;
        const api_key = apiToken;
        var payload = {
            messages: [
                { role: 'system', content: userInput },
                { role: 'user', content: spreadsheetData }
            ]
        };
        //console.log("送信されるプロンプト1:", JSON.stringify(payload));
        console.log("送信されるプロンプト2:", JSON.stringify(payload.messages[1].content));
        // OpenAI APIへのリクエストを送信します
        fetch(openAIEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': api_key
            },
            body: JSON.stringify(payload)
        })
        .then(response => response.json())
        .then(data => {
            console.log("OpenAIからの応答:", data);
            var contentText = data.choices[0].message.content;
            var formattedContent = contentText.replace(/\n/g, '<br>');
            responseArea.innerHTML = formatAnalysisContent(formattedContent);
            localStorage.setItem(`responseArea_${tabUrl}`, responseArea.innerHTML);
        })
        .catch(error => {
            console.error("OpenAI APIエラー:", error);
            responseArea.innerHTML = "OpenAI APIエラー: " + error; // エラーメッセージ表示
        });
    }

});

function extractTextBetweenMarkers(textContent, startMarker, endMarker) {
    const startIndex = textContent.indexOf(startMarker);
    const endIndex = textContent.indexOf(endMarker, startIndex);

    if (startIndex !== -1 && endIndex !== -1) {
        const actualStart = startIndex + startMarker.length;
        return textContent.substring(actualStart, endIndex).trim();
    }

    return ''; // マーカーが見つからない場合は空文字列を返す
}


function addSheetOptions(sheetList) {
    console.log(sheetList);
    var lines = sheetList.split('\n');
    lines.forEach(function(line) {
        var trimmedLine = line.trim();
        if(trimmedLine) {
            var option = new Option(trimmedLine, trimmedLine);
            sheetNameSelect.add(option);
        }
    });
}

function extractSheets(text) {
  // "スクリーン リーダーのサポートを有効にする"より下をカットする
  let cutOffIndex = text.indexOf('スクリーン リーダーのサポートを有効にする');
  if (cutOffIndex === -1) {
    console.error('指定したマーカーは見つかりませんでした。');
    return '';
  }
  text = text.substring(0, cutOffIndex).trim();

  // 一番下に残っている空白行を削除する
  while (text.endsWith("\n\n")) {
    text = text.substring(0, text.length - 2).trim();
  }
  
  // ファイルの中身を反転させる
  let lines = text.split("\n").reverse();
  
  // 逆順で各行をチェックし、空白行が出てきたら終了
  let extractedBlock = "";
  for (let line of lines) {
    if (line.trim() === "") {
      break;
    }
    extractedBlock = line + "\n" + extractedBlock;
  }

  // 最終的な文字列に最後の改行を削除し返す
  return extractedBlock.trimEnd();
}

// ページ読み込み時にスプレッドシートのデータを取得し、シート一覧を表示
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var UrlforSelect = tabs[0].url;
    if (UrlforSelect.includes('https://docs.google.com/spreadsheets/')) {
        sheetNameSelect.classList.remove('hidden');
        chrome.tabs.sendMessage(tabs[0].id, {action: "getPageData"}, function(response) {
            if (response && response.data) {
                var sheetData = response.data; // スプレッドシートのデータ
                console.log(sheetData.content)
                const extractedData = extractSheets(sheetData.content);
                var sheetList = extractedData; // シート名のリストを取得
                console.log(extractedData)
                addSheetOptions(sheetList);
            } else {
                if (chrome.runtime.lastError) {
                    console.error("メッセージ送信時にエラーが発生しました:", JSON.stringify(chrome.runtime.lastError, null, 2));
                    responseArea.innerText = "メッセージ送信時にエラーが発生しました:" + JSON.stringify(chrome.runtime.lastError, null, 2);
                } else {
                    console.error("アクティブページのデータ取得に失敗しました。");
                    responseArea.innerText = "アクティブページのデータ取得に失敗しました。"; // エラーメッセージ表示
                }
            }
        });
    } else {
        sheetNameSelect.classList.add('hidden');
    }
});

document.addEventListener('DOMContentLoaded', function() {
  var closeButton = document.getElementById('closeButton');
  closeButton.addEventListener('click', function() {
    window.close(); // ポップアップウィンドウを閉じる
  });
});

// コピーボタンのクリックイベントを追加するコード
document.getElementById('copyButton').addEventListener('click', function() {
  var code = responseArea.querySelector('code'); // コードブロックを取得
  var range = document.createRange();
  var selection = window.getSelection();

  range.selectNodeContents(code); // コード全体を選択
  selection.removeAllRanges(); // 既存の選択範囲をクリア
  selection.addRange(range); // 新たに選択範囲を設定

  try {
    document.execCommand('copy'); // コピーを実行
    alert('コードをコピーしました。');
  } catch (err) {
    console.error('コピーに失敗しました: ', err);
  }

  selection.removeAllRanges(); // 選択範囲をクリア
});
