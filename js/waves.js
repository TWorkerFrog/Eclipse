const WAVE_CONFIGS = [
  { budget: 8, weights: { kamikaze: 0.6, basic: 0.4 } },
  { budget: 13, weights: { kamikaze: 0.45, basic: 0.55 } },
  { budget: 17, weights: { kamikaze: 0.35, basic: 0.45, tank: 0.2 } },
];

class WaveManager {
  constructor() {
    this.wave = 0;
    this.remainingToSpawn = 0;
    this.weights = {};
    this.spawnTimerSeconds = 0;
    this.betweenWavesSeconds = 0;
    this.killTimestamps = [];
    this.finished = false;
  }

  startRun() {
    this.wave = 0;
    this.killTimestamps = [];
    this.finished = false;
    this.beginNextWave();
  }

  beginNextWave() {
    this.wave += 1;
    const config = WAVE_CONFIGS[this.wave - 1];
    this.remainingToSpawn = config.budget;
    this.weights = config.weights;
    this.spawnTimerSeconds = 0.8;
    this.betweenWavesSeconds = 0;
  }

  registerKill() {
    this.killTimestamps.push(performance.now() / 1000);
  }

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

  update(elapsedSeconds, enemies) {
    if (this.finished) return null;

    if (this.remainingToSpawn <= 0) {
      if (enemies.length > 0) return null;

      if (this.wave >= WAVE_CONFIGS.length) {
        this.finished = true;
        return null;
      }

      this.betweenWavesSeconds += elapsedSeconds;
      if (this.betweenWavesSeconds >= 1.5) this.beginNextWave();
      return null;
    }

    if (enemies.length >= 9) return null;

    this.spawnTimerSeconds -= elapsedSeconds;
    if (this.spawnTimerSeconds > 0) return null;

    const killRate = this.recentKillsPerSecond();
    const interval = Math.max(0.5, 1.6 - killRate * 0.25);
    this.spawnTimerSeconds = interval * (0.8 + Math.random() * 0.4);
    this.remainingToSpawn -= 1;

    return this.pickEnemyType();
  }

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
