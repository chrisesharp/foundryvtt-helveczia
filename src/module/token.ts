import { DocumentModificationOptions } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/abstract/document.mjs';
import { TokenDataProperties } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/tokenData';
import { PropertiesToSource } from '@league-of-foundry-developers/foundry-vtt-types/src/types/helperTypes';

export class HVToken extends Token {
  protected _getTooltipText(): string {
    // return super._getTooltipText();
    return '';
  }

  protected _onCreate(options: PropertiesToSource<TokenDataProperties>, userId: DocumentModificationOptions): void {
    const settings = canvas?.scene?.flags['helveczia'] ?? {};
    options.elevation = settings.elevation ?? CONFIG.HV.DEFAULT_ELEVATION;
    super._onCreate(options, userId);
  }
}
