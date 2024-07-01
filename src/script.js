// 获取选中的文字的范围和位置信息
function getSelectionCoordinates() {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0).cloneRange();
    const rect = range.getBoundingClientRect();
    return rect;
  }
  
  // 创建悬浮框
  function createFloatingBox(selectedText) {
    const rect = getSelectionCoordinates();
  
    // 创建悬浮框元素
    const floatingBox = document.createElement('div');
    floatingBox.style.position = 'absolute';
    floatingBox.style.top = `${rect.top + window.scrollY}px`;
    floatingBox.style.left = `${rect.left + window.scrollX}px`;
    floatingBox.style.width = '300px';
    floatingBox.style.padding = '10px';
    floatingBox.style.backgroundColor = 'white';
    floatingBox.style.border = '1px solid #ccc';
    floatingBox.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
    floatingBox.style.zIndex = '10000';
    floatingBox.style.borderRadius = '10px';
    floatingBox.style.color = 'black';  // 设置字体颜色为黑色
  
    // 添加内容到悬浮框
    floatingBox.innerHTML = `
      <div>
        <textarea id="editingBox" style="width: 100%; height: 80px; margin-bottom: 10px;">${selectedText}</textarea>
        <label for="progress1">Progress 1:</label>
        <input type="range" id="progress1" value="50" max="100" style="width: 100%;">
        <label for="progress2" style="margin-top: 10px;">Progress 2:</label>
        <input type="range" id="progress2" value="75" max="100" style="width: 100%;">
        <button id="confirmButton" style="margin-top: 10px; width: 100%;">Confirm</button>
      </div>
    `;
  
    // 确认按钮功能
    floatingBox.querySelector('#confirmButton').addEventListener('click', () => {
      const text = document.querySelector('#editingBox').value;
      const progress1 = document.querySelector('#progress1').value;
      const progress2 = document.querySelector('#progress2').value;
      anonymizeText(progress1, progress2, text);
      document.body.removeChild(floatingBox);
    });
  
    // 添加悬浮框到文档
    document.body.appendChild(floatingBox);
  }
  
  // 从背景脚本接收消息并显示悬浮框
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'showFloatingBox') {
      createFloatingBox(request.selectedText);
      sendResponse({status: 'success'});
    }
  });
  
  // 假设的 anonymizeText 函数实现
  function anonymizeText(progress1, progress2, text) {
    console.log("Anonymizing text with progress1:", progress1, "progress2:", progress2, "text:", text);
    // 你的 anonymizeText 实现
  }
  