export function registerKeyBindings(): void {
  const scaleFunc = () => {
    const settings = canvas?.scene?.flags['helveczia'] ?? {};
    const scaleSetting = Math.max(0.05, Math.min(0.95, Math.abs(parseFloat(settings.scale))));
    return isFinite(scaleSetting) ? scaleSetting : CONFIG.HV.DEFAULT_SCENE_SCALE;
  };
  if (CONFIG.HV.depthTokens) {
    game.keybindings.register('helveczia', 'hv-token-forward', {
      name: 'token-forward',
      editable: [{ key: 'PageDown', modifiers: ['Shift'] }],
      onDown: () => {
        setElevation(1, 1 + scaleFunc());
        return true;
      },
    });
    game.keybindings.register('helveczia', 'hv-token-back', {
      name: 'token-back',
      editable: [{ key: 'PageUp', modifiers: ['Shift'] }],
      onDown: () => {
        setElevation(-1, 1 - scaleFunc());
        return true;
      },
    });
  }
}

async function setElevation(elevationChange, scaleChange) {
  const tokens = canvas?.tokens?.controlled ?? [];
  const updates = tokens.map((token) => {
    const elevation = parseInt(token.document.elevation) + elevationChange;
    return {
      _id: token.id,
      elevation: elevation >= 0 ? elevation : 0,
      texture: {
        scaleX: elevation >= 0 ? token.document.texture.scaleX * scaleChange : token.document.texture.scaleX,
        scaleY: elevation >= 0 ? token.document.texture.scaleY * scaleChange : token.document.texture.scaleY,
      },
    };
  });
  const options = {
    animation: { duration: 100 },
  };
  await canvas?.scene?.updateEmbeddedDocuments('Token', updates, options);
  // Force token HUD to re-render, to make its elevation input show the new height
  if (canvas?.hud?.token.rendered) {
    canvas.hud.token.render();
  }
}
