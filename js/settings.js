const fullscreenButton = document.getElementById('btn-fullscreen');

fullscreenButton.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      fullscreenButton.textContent = 'Полный экран';
    } else {
      await document.documentElement.requestFullscreen();
      fullscreenButton.textContent = 'Оконный режим';
    }
  } catch (err) {
    console.warn('Fullscreen API недоступен:', err);
  }
});

document.addEventListener('fullscreenchange', () => {
  fullscreenButton.textContent = document.fullscreenElement
    ? 'Оконный режим'
    : 'Полный экран';
});
