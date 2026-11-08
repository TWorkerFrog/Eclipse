// Определения улучшений: apply меняет только состояние текущего забега,
// config.js остаётся неизменной базой
const upgradeDefinitions = [
  {
    id: 'damage',
    type: 'common',
    title: 'Урон',
    description: 'Увеличение урона обычной пули на 20%',
    requiresUnique: null,
    apply(game) {
      game.ship.regularDamageBonus += 2;
    },
  },
  {
    id: 'fire_rate',
    type: 'common',
    title: 'Скорострельность',
    description: 'Увеличение скорострельности на 10%',
    requiresUnique: null,
    apply(game) {
      game.ship.fireCooldownSeconds *= 0.9;
    },
  },
  {
    id: 'ship_speed',
    type: 'common',
    title: 'Скорость',
    description: 'Увеличение скорости разгона корабля на 15%',
    requiresUnique: null,
    apply(game) {
      game.ship.accelerationPixelsPerSecondSquared *= 1.15;
    },
  },
  {
    id: 'max_hp',
    type: 'common',
    title: 'Корпус',
    description: 'Увеличение максимума здоровья на 20',
    requiresUnique: null,
    apply(game) {
      game.ship.maxHp += 20;
      game.ship.hp += 20;
    },
  },
  {
    id: 'special_damage',
    type: 'common',
    title: 'Урон особого',
    description: 'Увеличение урона особого выстрела на 25%',
    requiresUnique: null,
    apply(game) {
      game.ship.specialDamageBonus += 15;
    },
  },
  {
    id: 'special_range',
    type: 'common',
    title: 'Дальность особого',
    description: 'Увеличение дальности полёта особого выстрела на 15%',
    requiresUnique: null,
    apply(game) {
      game.ship.specialLifetimeBonusSeconds += 0.3;
    },
  },
  {
    id: 'special_charges',
    type: 'common',
    title: 'Заряды особого',
    description: 'Увеличение запаса зарядов особого выстрела на 1',
    requiresUnique: null,
    apply(game) {
      game.ship.maxCharge += 1;
    },
  },
  {
    id: 'dash_recharge',
    type: 'common',
    title: 'Перезарядка дэша',
    description: 'Ускорение перезарядки рывка на 20%',
    requiresUnique: null,
    apply(game) {
      game.ship.dashCooldownSeconds *= 0.8;
    },
  },
  {
    id: 'dash_distance',
    type: 'common',
    title: 'Дальность дэша',
    description: 'Увеличение дальности рывка на 10%',
    requiresUnique: null,
    apply(game) {
      game.ship.dashSpeedPixelsPerSecond *= 1.1;
    },
  },
  {
    id: 'shard_lifetime',
    type: 'common',
    title: 'Живучесть осколков',
    description: 'Увеличение времени жизни осколков на 1 секунду',
    requiresUnique: null,
    apply(game) {
      game.ship.shardLifetimeBonusSeconds += 1;
    },
  },
  {
    id: 'shard_charge',
    type: 'common',
    title: 'Заряд с осколка',
    description: 'Увеличение заряда с каждого осколка на 20%',
    requiresUnique: null,
    apply(game) {
      game.ship.shardChargeBonus += 0.05;
    },
  },
  {
    id: 'shard_attraction',
    type: 'common',
    title: 'Магнит осколков',
    description: 'Увеличение радиуса магнита осколков на треть',
    requiresUnique: null,
    apply(game) {
      game.ship.shardAttractionBonusPixels += 30;
    },
  },

  // Уникальные: после волн 3 и 6, одно на забег
  {
    id: 'ricochet',
    type: 'unique',
    title: 'Рикошет',
    description: 'Обычная пуля отскакивает в ближайшего врага после попадания',
    requiresUnique: null,
    apply(game) {
      game.ship.upgrades.ricochet = true;
      game.ship.ricochetBounces = 1;
    },
  },
  {
    id: 'scavenger',
    type: 'unique',
    title: 'Падальщик',
    description: 'Лечение на 2 HP за убийство обычной пулей',
    requiresUnique: null,
    apply(game) {
      game.ship.upgrades.scavenger = true;
      game.ship.scavengerHealAmount = 2;
    },
  },
  {
    id: 'boom',
    type: 'unique',
    title: 'Бабах',
    description: 'Особый выстрел взрывается в конце полёта и бьёт по площади',
    requiresUnique: null,
    apply(game) {
      game.ship.upgrades.boom = true;
      game.ship.boomDamage = 45;
      game.ship.boomRadiusPixels = 90;
    },
  },
  {
    id: 'ram',
    type: 'unique',
    title: 'Таран',
    description: 'Рывок наносит врагам урон и отбрасывает их',
    requiresUnique: null,
    apply(game) {
      game.ship.upgrades.ram = true;
      game.ship.ramDamage = 25;
    },
  },
  {
    id: 'double_dash',
    type: 'unique',
    title: 'Двойной рывок',
    description: 'Добавляет второй заряд рывка',
    requiresUnique: null,
    apply(game) {
      game.ship.upgrades.double_dash = true;
      game.ship.maxDashCharges = 2;
      game.ship.availableDashCharges += 1;
    },
  },
  {
    id: 'healing_shards',
    type: 'unique',
    title: 'Лечебные осколки',
    description: 'Подбор осколка лечит на 8 HP',
    requiresUnique: null,
    apply(game) {
      game.ship.upgrades.healing_shards = true;
      game.ship.healingShardsHealAmount = 8;
    },
  },

  // Поддерживающие: выпадают только после своего уникального улучшения
  {
    id: 'ricochet_bounce',
    type: 'common',
    title: 'Дополнительный отскок',
    description: 'Увеличение числа отскоков пули на 1',
    requiresUnique: 'ricochet',
    apply(game) {
      game.ship.ricochetBounces += 1;
    },
  },
  {
    id: 'scavenger_heal',
    type: 'common',
    title: 'Жадность',
    description: 'Увеличение лечения за убийство на 2 HP',
    requiresUnique: 'scavenger',
    apply(game) {
      game.ship.scavengerHealAmount += 2;
    },
  },
  {
    id: 'boom_radius',
    type: 'common',
    title: 'Большой бабах',
    description: 'Увеличение радиуса взрыва на треть',
    requiresUnique: 'boom',
    apply(game) {
      game.ship.boomRadiusBonus += 30;
    },
  },
  {
    id: 'ram_damage',
    type: 'common',
    title: 'Тяжёлый таран',
    description: 'Увеличение урона тарана на 40%',
    requiresUnique: 'ram',
    apply(game) {
      game.ship.ramDamage += 10;
    },
  },
  {
    id: 'double_dash_recharge',
    type: 'common',
    title: 'Форсаж рывка',
    description: 'Дополнительное ускорение перезарядки рывка на 20%',
    requiresUnique: 'double_dash',
    apply(game) {
      game.ship.dashCooldownSeconds *= 0.8;
    },
  },
  {
    id: 'healing_shards_heal',
    type: 'common',
    title: 'Сильные осколки',
    description: 'Увеличение лечения за осколок на 4 HP',
    requiresUnique: 'healing_shards',
    apply(game) {
      game.ship.healingShardsHealAmount += 4;
    },
  },
];

// Тасовалка Фишера-Йетса, чтобы не мутировать исходный массив определений
function shuffleUpgrades(list) {
  const copy = list.slice();
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

class UpgradeSystem {
  constructor(game) {
    this.game = game;
    this.element = document.getElementById('upgrade-screen');
    this.cardsElement = this.element.querySelector('.upgrade-cards');
  }

  // Собирает пул нужного типа, исключая полученное и недоступное,
  // и показывает до трёх карточек. Возвращает true, если экран показан
  showChoices(waveNumber) {
    const choiceType = (waveNumber === 3 || waveNumber === 6)
      ? 'unique'
      : 'common';
    const pool = upgradeDefinitions.filter((definition) => {
      if (definition.type !== choiceType) return false;
      if (this.game.acquiredUpgrades.has(definition.id)) return false;
      if (definition.requiresUnique
        && !this.game.acquiredUpgrades.has(definition.requiresUnique)) {
        return false;
      }
      return true;
    });

    const choices = shuffleUpgrades(pool).slice(0, 3);
    if (choices.length === 0) return false;

    this.cardsElement.replaceChildren();
    for (const definition of choices) {
      this.cardsElement.append(this.createCard(definition));
    }
    this.element.classList.remove('hidden');
    // Затемнение фона, как на паузе
    pauseDimmer.classList.remove('hidden');
    this.game.hud.hide();
    this.game.state = states.Selection;
    return true;
  }

  createCard(definition) {
    const card = document.createElement('button');
    card.type = 'button';
    // Уникальные подсвечиваются сильнее через отдельный класс,
    // сам тип игроку текстом не показываем
    card.className = definition.type === 'unique'
      ? 'upgrade-card upgrade-card-unique'
      : 'upgrade-card';

    const title = document.createElement('span');
    title.className = 'upgrade-title';
    title.textContent = definition.title;

    const description = document.createElement('span');
    description.className = 'upgrade-description';
    description.textContent = definition.description;

    card.append(title, description);
    card.onclick = () => this.choose(definition.id);
    return card;
  }

  choose(id) {
    const definition = upgradeDefinitions.find((item) => item.id === id);
    if (!definition) return;

    music.buttonSound('click');
    definition.apply(this.game);
    this.game.acquiredUpgrades.add(id);
    this.hide();
    this.game.state = states.Play;
  }

  hide() {
    this.element.classList.add('hidden');
    pauseDimmer.classList.add('hidden');
    this.cardsElement.replaceChildren();
  }

  reset() {
    this.hide();
  }
}
