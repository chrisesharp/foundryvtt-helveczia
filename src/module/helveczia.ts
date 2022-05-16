/**
 * This is your TypeScript entry file for Foundry VTT.
 * Register custom settings, sheets, and constants using the Foundry API.
 * Change this heading to be more descriptive to your system, or remove it.
 * Author: [your name]
 * Content License: [copyright and-or license] If using an existing system
 * 					you may want to put a (link to a) license or copyright
 * 					notice here (e.g. the OGL).
 * Software License: [your license] Put your desired license here, which
 * 					 determines how others may use and modify your system.
 */

// Import TypeScript modules
import { registerSettings } from './settings';
import { preloadTemplates } from './preloadTemplates';
import { Logger } from './logger';
import { HVCharacterSheet } from './actor/character-sheet';
import { HVActor } from './actor/actor';

import { HVItem } from './items/item';
import { SkillSheet } from './items/skill/skill-sheet';
import { PossessionSheet } from './items/possesion/possession-sheet';
import { ArmourSheet } from './items/armour/armour-sheet';
import { WeaponSheet } from './items/weapon/weapon-sheet';
import { DeedSheet } from './items/deed/deed-sheet';
import { ClassSheet } from './items/class/class-sheet';
import { PeopleSheet } from './items/people/people-sheet';

import { HV } from './config';
import { registerHandlebarHelpers } from './handlebar-helpers';
// import { HVItemSheetConfig } from './items/item-config';

const log = new Logger();

// Initialize system
Hooks.once('init', async () => {
  log.info('Initializing Helvéczia');

  // Enable hook debug
  CONFIG.debug.hooks = false;

  // Assign custom classes and constants here
  CONFIG.HV = HV;
  CONFIG.Actor.documentClass = HVActor;
  CONFIG.Item.documentClass = HVItem;

  CONFIG.HV.showEffects = true;

  // Register custom system settings
  registerSettings();

  // Register custom handlebar helpers
  registerHandlebarHelpers();

  // Preload Handlebars templates
  await preloadTemplates();

  // Register custom sheets (if any)
  // Register sheet application classes

  Actors.unregisterSheet('core', ActorSheet);
  Items.unregisterSheet('core', ItemSheet);
  Actors.registerSheet('helveczia', HVCharacterSheet, { types: ['character', 'npc'], makeDefault: true });
  Items.registerSheet('helveczia', SkillSheet, { types: ['skill'] });
  Items.registerSheet('helveczia', PossessionSheet, { types: ['possession'] });
  Items.registerSheet('helveczia', ArmourSheet, { types: ['armour'] });
  Items.registerSheet('helveczia', WeaponSheet, { types: ['weapon'] });
  Items.registerSheet('helveczia', ClassSheet, { types: ['class'] });
  Items.registerSheet('helveczia', DeedSheet, { types: ['deed'] });
  Items.registerSheet('helveczia', PeopleSheet, { types: ['people'] });
  // DocumentSheetConfig.registerSheet(DocumentSheetConfig, "helveczia", HVItemSheetConfig, {makeDefault: true});
});

// Setup system
Hooks.once('setup', async () => {
  // Do anything after initialization but before
  // ready
});

// When ready
Hooks.once('ready', async () => {
  // Do anything once the system is ready
  if (game.user?.isGM) {
    const hungarians = game.actors?.filter((i) => i.isHungarian());
    if (hungarians?.length) {
      Promise.all(hungarians?.map(async (actor) => await actor.setFlag('helveczia', 'fate-invoked', false)));
      console.log('Fate of Hungarians reset');
    }
  }
});

// Add any additional hooks if necessary
Hooks.on('applyActiveEffect', async (actor, changeData) => {
  actor.applyCustomEffect(changeData);
});

// Hooks.on("renderDialog", (dialog, html) => {
// Array.from(html.find("#document-create option")).forEach(i => {
//     if (i.value == "your-item-type")
//     {
//         i.remove()
//     }
// })
// })
