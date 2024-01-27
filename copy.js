// DOMContentLoadedイベントハンドラ内にコピー機能のセットアップを含める
document.addEventListener('DOMContentLoaded', function() {
  // 'copyStatus'要素とコードブロックのテキストを取得
  var copyStatus = document.getElementById('copyStatus');

  // `Copy code`テキスト部分がクリックされたときのイベントリスナー
  copyStatus.addEventListener('click', function() {
    // 'code-block'要素からテキストを取得し、クリップボードにコピーする
    var code = document.querySelector('.code-block code').textContent;
    navigator.clipboard.writeText(code).then(() => {
      copyStatus.textContent = 'Copied'; // コピー成功時、テキストを変更
      copyStatus.classList.add('disabled'); // スタイルを変更して非活性化を表現
    }).catch(err => {
      // エラー処理
      console.error('Failed to copy:', err);
    });
  });
});
