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
}
