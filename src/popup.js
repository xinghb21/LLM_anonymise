document.addEventListener('DOMContentLoaded', async () => {
    const slider = document.getElementById('privacySlider');
    const sliderValue = document.getElementById('privacySliderValue');
    const applyButton = document.getElementById('applyPrivacyButton');

    slider.addEventListener('input', () => {
        sliderValue.textContent = slider.value;
    });

    const { selectedText } = await chrome.storage.local.get('selectedText');

    applyButton.addEventListener('click', async () => {
        const level = slider.value;

        chrome.runtime.sendMessage({ action: "anonymize", text: selectedText, level }, (response) => {
            alert(response.result);
            window.close();
        });
    });
});
