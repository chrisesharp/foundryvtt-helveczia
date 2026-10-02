import { Logger } from './logger';

const log = new Logger();

export function registerSettings(): void {
  log.info('Registering Helvéczia System Settings');
  game.settings.register('helveczia', 'debug', {
    name: game.i18n.localize('HV.Setting.debug'),
    hint: game.i18n.localize('HV.Setting.debugHint'),
    default: false,
    scope: 'world',
    type: Boolean,
    config: true,
  });

  game.settings.register('helveczia', 'effects', {
    name: game.i18n.localize('HV.Setting.effects'),
    hint: game.i18n.localize('HV.Setting.effectsHint'),
    default: false,
    scope: 'world',
    type: Boolean,
    config: true,
    onChange: (value: boolean) => {
      CONFIG.HV.showEffects = value;
    },
  });

  game.settings.register('helveczia', 'token-flip', {
    name: game.i18n.localize('HV.Setting.token.Flip'),
    hint: game.i18n.localize('HV.Setting.token.FlipHint'),
    default: true,
    scope: 'world',
    type: Boolean,
    config: true,
    onChange: (value: boolean) => {
      CONFIG.HV.flipTokens = value;
    },
  });

  game.settings.register('helveczia', 'token-depth', {
    name: game.i18n.localize('HV.Setting.token.Depth'),
    hint: game.i18n.localize('HV.Setting.token.DepthHint'),
    default: false,
    scope: 'world',
    type: Boolean,
    config: true,
    onChange: (value: boolean) => {
      CONFIG.HV.depthTokens = value;
    },
  });

  game.settings.register('helveczia', 'systemMigrationVersion', {
    config: false,
    scope: 'world',
    type: String,
    default: '',
  });

  game.settings.register('helveczia', 'encumbrance', {
    name: game.i18n.localize('HV.Setting.encumbrance'),
    hint: game.i18n.localize('HV.Setting.encumbranceHint'),
    config: true,
    scope: 'world',
    type: Boolean,
    default: false,
    onChange: (value: boolean) => {
      CONFIG.HV.applyEncumbrance = value;
    },
  });

  game.settings.register('helveczia', 'player-deed-edit', {
    name: game.i18n.localize('HV.Setting.playerDeedEdit'),
    hint: game.i18n.localize('HV.Setting.playerDeedEditHint'),
    config: true,
    scope: 'world',
    type: Boolean,
    default: false,
    onChange: (value: boolean) => {
      CONFIG.HV.allowPlayerDeedEdit = value;
    },
  });
}
