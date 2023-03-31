import { nameTests } from './names.test';
import { actorTests } from './actor.test';

function registerQuenchTests(quench) {
  quench.registerBatch('helveczia.names', nameTests);
  quench.registerBatch('helveczia.actor', actorTests);
}

export function init() {
  // Use Quench's ready hook to add our tests. This hook will never be triggered if Quench isn't loaded.
  Hooks.on('quenchReady', registerQuenchTests);
}
