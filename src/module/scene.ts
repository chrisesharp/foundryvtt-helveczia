export class HVSceneConfig extends SceneConfig {
  protected async _renderInner(data: SceneConfig.Data<DocumentSheetOptions>): Promise<JQuery<HTMLElement>> {
    const $html = await super._renderInner(data);
    if (game.settings.get('helveczia', 'token-depth')) {
      // add scene config for scale factor
      const scale = (this.object as Scene)?.flags?.helveczia?.scale ?? CONFIG.HV.DEFAULT_SCENE_SCALE;
      const elevation = (this.object as Scene)?.flags?.helveczia?.elevation ?? CONFIG.HV.DEFAULT_ELEVATION;
      const scaling = $(`<hr><div class="form-group">
          <label>${game.i18n.localize('HV.Setting.token.Scale')}</label>
          <div class="form-fields">
            <input type="text" name="flags.helveczia.scale" value="${scale}"/>
          </div>
          <p class="notes">
          ${game.i18n.localize('HV.Setting.token.ScaleHint')}
          </p>
          <label>${game.i18n.localize('HV.Setting.token.DepthDefault')}</label>
          <div class="form-fields">
            <input type="text" name="flags.helveczia.elevation" value="${elevation}"/>
          </div>
          <p class="notes">
          ${game.i18n.localize('HV.Setting.token.DepthDefaultHint')}
          </p>
        </div>
      `);
      $html.find('div[data-tab="basic"]').append(scaling);
    }
    return $html;
  }
}
