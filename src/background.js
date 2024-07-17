let mode = "None";

chrome.runtime.onInstalled.addListener(() => {
    console.log('Privacy Control with OpenAI extension installed.');

    chrome.contextMenus.create({
        id: "anonymize-text",
        title: "Anonymize text",
        contexts: ["selection"]
    });
});

function getTabId(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        callback(tabs[0].id);
    });
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.mode) {
        console.log('Received mode:', request.mode);
        mode = request.mode;
        sendResponse({ status: 'Mode received' });
    }
});

let scriptInjected = {};

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "anonymize-text") {
        let selectedText = info.selectionText || " ";
        console.log("Executing script with selected text:", selectedText);
        getTabId((tabId) => {
            let currentTabUrl = tab.url;
            if (!!scriptInjected.hasOwnProperty(tabId) || !scriptInjected[tabId]) {
                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ["dist/script.bundle.js"]
                }).then(() => {
                    console.log("Injected script file");
                    scriptInjected[tabId] = true;
                    sendMessageToTab(tab.id, selectedText, currentTabUrl);
                }).catch((err) => {
                    console.error("Failed to inject script:", err);
                });
            } else {
                sendMessageToTab(tab.id, selectedText, currentTabUrl);
            }
        });
    }
});

function sendMessageToTab(tabId, selectedText, tabUrl) {
    chrome.tabs.sendMessage(tabId, { action: 'showFloatingBox', selectedText: selectedText, mode: mode, tabUrl: tabUrl }, (response) => {
        if (chrome.runtime.lastError) {
            console.error('Error sending message:', chrome.runtime.lastError.message);
        } else {
            console.log('Response from content script:', response);
        }
    });
}

chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'fetchData') {
        const url = 'http://43.153.182.221:5001/anonymize';
        let params = new URLSearchParams({ data: message.data });

        fetch(`${url}?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Origin': message.origin,
            }
        })
        .then(response => response.json())
        .then(data => {
            sendResponse({ success: true, data: data });
        })
        .catch(error => {
            console.error('Error:', error);
            sendResponse({ success: false, error: error });
        });

        return true;
    }
    if (message.type === 'AddLog') {
        console.log('Received log:', message);
        const url = "http://43.153.182.221:5001/write_to_file";
        const data = { raw: message.raw, processed: message.processed, last: message.last };
    
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log('Success:', data);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    }
});
