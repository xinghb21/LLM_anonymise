document.addEventListener('DOMContentLoaded', function () {
    const buttons = document.querySelectorAll('.privacyButton');
    
    // Load the saved mode from storage
    chrome.storage.sync.get(['selectedMode'], function(result) {
        const savedMode = result.selectedMode || 'None';
        buttons.forEach(button => {
            if (button.textContent.trim() === savedMode) {
                button.classList.add('selected');
            }
        });
    });

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            buttons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            
            const selectedMode = button.textContent.trim();
            
            // Save the selected mode to storage
            chrome.storage.sync.set({ selectedMode: selectedMode }, function() {
                console.log('Mode saved:', selectedMode);
            });

            // Send the selected mode to the background or script
            chrome.runtime.sendMessage({ mode: selectedMode }, function(response) {
                console.log('Mode sent to background:', selectedMode);
            });
        });
    });
});
