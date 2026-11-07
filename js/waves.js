class WaveManager {
  constructor() {
    this.wave = 0;
    this.remainingToSpawn = 0; // Сколько врагов нужно создать в текущей волне
    this.weights = {};
    this.spawnTimerSeconds = 0; // Таймер для спавна следующего врага внутри волны
    this.betweenWavesSeconds = 0; // Пауза медлу волнами
    this.killTimestamps = []; // Массив времени последних убийств
    this.finished = false;
    this.waveCleared = false; // Волна зачищена: сигнал для экрана улучшений
  }

  // Начинает полный забег: сбрасывает волну и запускает первую.
  startRun() {
    this.wave = 0;
    this.killTimestamps = [];
    this.finished = false;
    this.beginNextWave();
  }

  // Функция для начала волны
  beginNextWave() {
    this.wave += 1;
    const config = waveConfigs[this.wave - 1];
    this.remainingToSpawn = config.budget;
    this.weights = config.weights;
    this.spawnTimerSeconds = 0.8;
    this.betweenWavesSeconds = 0;
    this.waveCleared = false;
  }

  // Вызывается при смерти врага. Записывает время убийства для подсчёта темпа убийств
  registerKill() {
    this.killTimestamps.push(performance.now() / 1000);
  }

  // Считает, сколько в среднем врагов убивали в секунду за последние 6 секунд
  recentKillsPerSecond() {
    const now = performance.now() / 1000;
    this.killTimestamps = this.killTimestamps.filter(
      (timestamp) => now - timestamp < 6,
    );
    return this.killTimestamps.length / 6;
  }

  isRunComplete() {
    return this.finished;
  }

  // Основная логика спавна внутри волны. Каждый кадр уменьшает таймер, и когда он доходит до 0:
  update(elapsedSeconds, enemies) {
    if (this.finished) return null;

    if (this.remainingToSpawn <= 0) {
      if (enemies.length > 0) return null;

      if (this.wave >= waveConfigs.length) {
        this.finished = true;
        return null;
      }

      // Волна зачищена: игра может показать выбор улучшения.
      // Пауза между волнами при этом не идёт, пока открыт экран выбора
      this.waveCleared = true;
      this.betweenWavesSeconds += elapsedSeconds;
      if (this.betweenWavesSeconds >= 1.5) this.beginNextWave();
      return null;
    }

    if (enemies.length >= 12) return null;

    this.spawnTimerSeconds -= elapsedSeconds;
    if (this.spawnTimerSeconds > 0) return null;

    const killRate = this.recentKillsPerSecond();
    const interval = Math.max(0.5, 1.6 - killRate * 0.25);
    this.spawnTimerSeconds = interval * 0.8;
    this.remainingToSpawn -= 1;

    return this.pickEnemyType();
  }

  // Случайно выбирает тип следующего врага по весам из конфига волны
  pickEnemyType() {
    const totalWeight = Object.values(this.weights)
      .reduce((sum, weight) => sum + weight, 0);
    let roll = Math.random() * totalWeight;

    for (const [type, weight] of Object.entries(this.weights)) {
      roll -= weight;
      if (roll <= 0) return type;
    }
    return Object.keys(this.weights)[0];
  }
}
