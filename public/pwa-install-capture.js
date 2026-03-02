(function () {
    window.addEventListener("beforeinstallprompt", function (e) {
        e.preventDefault();
        window.__pwaInstallPromptEvent = e;
    });
})();
