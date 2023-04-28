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
  });

  game.settings.register('helveczia', 'token-flip', {
    name: game.i18n.localize('HV.Setting.tokenFlip'),
    hint: game.i18n.localize('HV.Setting.tokenFlipHint'),
    default: true,
    scope: 'world',
    type: Boolean,
    config: true,
  });

  game.settings.register('helveczia', 'token-depth', {
    name: game.i18n.localize('HV.Setting.tokenDepth'),
    hint: game.i18n.localize('HV.Setting.tokenDepthHint'),
    default: false,
    scope: 'world',
    type: Boolean,
    config: true,
  });
}
