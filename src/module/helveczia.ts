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
import { SkillSheet } from './items/skill/skill-sheet';
import { HVItem } from './items/item';
import { HV } from './config';
import { registerHandlebarHelpers } from './handlebar-helpers';
import { PossessionSheet } from './items/possesion/possession-sheet';

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
});

// Setup system
Hooks.once('setup', async () => {
  // Do anything after initialization but before
  // ready
});

// When ready
Hooks.once('ready', async () => {
  // Do anything once the system is ready
});

// Add any additional hooks if necessary
