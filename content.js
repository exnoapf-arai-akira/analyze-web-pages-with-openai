// content.js
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "getPageData") {
        var pageData = {
            title: document.title,
            url: window.location.href,
            content: document.body.innerText
        };
        sendResponse({ data: pageData });
        return true; // 非同期レスポンスを示すために return true を記述
    }
});
