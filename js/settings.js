const fullscreenButton = document.getElementById('btn-fullscreen');

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await document.documentElement.requestFullscreen();
    }
  } catch (err) {
    console.warn('Fullscreen API недоступен:', err);
  }
}

fullscreenButton.addEventListener('click', async () => {
  await toggleFullscreen();
});

window.addEventListener('fullscreen-toggle', toggleFullscreen);

document.addEventListener('fullscreenchange', () => {
  fullscreenButton.textContent = document.fullscreenElement
    ? 'Оконный режим'
    : 'Полный экран';
});
