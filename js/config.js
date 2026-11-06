const bulletBase = {
  regular: {
    speed: 820,
    radius: 4,
    lifetimeSeconds: 1.15,
    damage: 10,
  },
  special: {
    speed: 660,
    radius: 30,
    lifetimeSeconds: 2.2,
    damage: 60,
  },
};

const enemyBulletBase = {
  radius: 5,
  lifetimeSeconds: 4,
};

const enemyConfigs = {
  kamikaze: {
    type: 'kamikaze',
    hp: 10,
    radius: 8,
    acceleration: 560,
    maxSpeed: 330,
    contactDamage: 12,
    contactDamageCooldownSeconds: 1,
    shardCount: 1,
    shapeSides: 3,
  },
  basic: {
    type: 'basic',
    hp: 30,
    radius: 12,
    acceleration: 420,
    maxSpeed: 190,
    contactDamage: 10,
    contactDamageCooldownSeconds: 1,
    shardCount: 2,
    shapeSides: 5,
    preferredDistance: 300,
    attackCooldownSeconds: 1.8,
    firstShotDelaySeconds: 1.2,
    bulletSpeed: 300,
    damage: 10,
  },
  tank: {
    type: 'tank',
    hp: 130,
    radius: 20,
    acceleration: 170,
    maxSpeed: 75,
    contactDamage: 20,
    contactDamageCooldownSeconds: 1,
    shardCount: 4,
    shapeSides: 6,
    preferredDistance: 380,
    attackCooldownSeconds: 2.4,
    firstShotDelaySeconds: 2.4,
    areaCastSeconds: 0.9,
    areaRadiusPixels: 70,
    damage: 25,
  },
};

const waveConfigs = [
  { budget: 8, weights: { basic: 0.5, kamikaze: 0.5 } },
  { budget: 6, weights: { kamikaze: 0.45, basic: 0.55 } },
  { budget: 4, weights: { tank: 1.0 } },
];
