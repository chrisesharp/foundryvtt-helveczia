import { nameTests } from './names.test';

function registerQuenchTests(quench) {
  quench.registerBatch('helveczia.samples', nameTests);
}

export function init() {
  // Use Quench's ready hook to add our tests. This hook will never be triggered if Quench isn't loaded.
  Hooks.on('quenchReady', registerQuenchTests);
}
