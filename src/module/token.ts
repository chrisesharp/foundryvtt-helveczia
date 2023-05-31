import { DocumentModificationOptions } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/abstract/document.mjs';
import { TokenDataProperties } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/tokenData';
import { PropertiesToSource } from '@league-of-foundry-developers/foundry-vtt-types/src/types/helperTypes';

export class HVToken extends Token {
  protected _onCreate(options: PropertiesToSource<TokenDataProperties>, userId: DocumentModificationOptions): void {
    const settings = canvas?.scene?.flags['helveczia'] ?? {};
    options.elevation = settings.elevation ?? CONFIG.HV.DEFAULT_ELEVATION;
    super._onCreate(options, userId);
  }

  /**
   * Refresh display of elements of the Token HUD.
   * @param {object} options          Which components of the HUD to refresh?
   * @param {boolean} [options.bars]        Re-draw bars?
   * @param {boolean} [options.border]      Re-draw the border?
   * @param {boolean} [options.effects]     Re-draw effect icons?
   * @param {boolean} [options.elevation]   Re-draw elevation text
   * @param {boolean} [options.nameplate]   Re-draw the nameplate?
   */
  refreshHUD(options = {}) {
    options.elevation = !CONFIG.HV.depthTokens;
    super.refreshHUD(options);
  }
}
