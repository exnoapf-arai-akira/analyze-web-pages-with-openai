# Analyze Web pages with OpenAI 拡張機能

Analyze Web pages with OpenAI は、Webページのデータを Azure OpenAI に送信し、自然言語処理やデータ分析を依頼するための Google Chrome 拡張機能です。Google SheetsもGAS経由で読み込みできます。

## 主な特徴

- ウェブページやGoogle Sheets データの自動読み取りと Azure OpenAI との連携
- データ分析や要約の依頼と結果表示
- ユーザーの任意のテキスト入力に基づいたOpenAIへの分析或いは要約
- ブラウザで認証できていれば、基本的には分析が可能

## 初めに

本拡張機能の利用には Azure の API トークンとエンドポイント URL が必要です。また、Google Sheetsを読み込むためにはオプションページでスプレッドシート ID と Google Apps Script (GAS) デプロイ URL のペアを設定と、読み込みたいスプレッドシートでGASのセットアップと権限設定も必要となります。

### インストール方法

1. このリポジトリをクローンします。

    ```bash
    git clone https://github.com/your-username/spreadsheet-to-azure-openai.git
    ```

2. Chrome ブラウザで `chrome://extensions/` を開き、デベロッパーモードを有効化します。
3. 「パッケージ化されてない拡張機能を読み込む」を選択し、クローンしたリポジトリのフォルダを選択してインストールします。

### 設定

オプションページから Azure OpenAI の API トークンとエンドポイント URL を入力し、保存します。必要であれば、追加でスプレッドシートと GAS のデプロイ URL をペアとして設定します。

## GASのセットアップ

スプレッドシートの拡張機能、Apps Script、ファイルを追加下記に示しているGASコードを入力しSaveしてください。右上のデプロイボタンから、新しいデプロイ、種類の選択、ウェブアプリでデプロイしてください。ウェブアプリのURLが表示されてるのでコピーし、ブラウザのアドレス欄へ入力アドレスの最後にクエリを追加してください。シート1のシートがあるスプレッドシートなら?sheet=シート1を追加しエンターを押下してください。そこで認証認可の設定が可能ですので許可設定すればOKです。次にChrome拡張機能のアイコンからオプション設定画面を表示し、Google Apps Script (GAS) デプロイ URL（execまでで良い）とプレッドシートのURLを記入し追加してください。

## GASコード
   ```javascript
   function getDataFromSheet(sheetName) {
     var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName); // シート名を指定してシートを取得
     var data = sheet.getDataRange().getValues(); // データを取得
     return data; // データをそのまま返す
   }

   function constructJSONResponse(data) {
     return ContentService.createTextOutput(JSON.stringify(data))
       .setMimeType(ContentService.MimeType.JSON);
   }

   function doGet(e) {
     var sheetName = e.parameter.sheet; // クエリパラメータからシート名を取得
     var data = getDataFromSheet(sheetName); // 指定されたシートからデータを取得
     return constructJSONResponse(data); // JSON形式でデータを返す
   }
   ```

## 使用方法

1. 分析したいデータが含まれている ウェブページもしくはGoogle Sheets を開きます。
2. 拡張機能のアイコンをクリックしてポップアップを開きます。
3. テキスト(プロンプト)を入力し、「Submit」ボタンをクリックします。スプレッドシートの場合は、シートの名前を選択できるようになりますので適宜選択してください。
4. 分析結果がポップアップに表示されます。時間がかかります。

## 貢献する

このプロジェクトに関するバグ報告、新機能の提案、またはプルリクエストによる貢献を歓迎します。

## ライセンス

このプロジェクトは MIT ライセンスの下で公開されています - 詳細については [LICENSE](LICENSE) ファイルをご覧ください。
