const { loadTemplates } = foundry.applications.handlebars;

export async function preloadTemplates(): Promise<Handlebars.TemplateDelegate[]> {
  const templatePaths: string[] = [
    // Add paths to 'systems/helveczia/templates'
    // Actor Dialogs
    'systems/helveczia/templates/actor/dialogs/character-creation.hbs',
    'systems/helveczia/templates/actor/dialogs/choose-origin.hbs',
    'systems/helveczia/templates/actor/dialogs/choose-specialism.hbs',
    'systems/helveczia/templates/actor/dialogs/npc-creation.hbs',
    'systems/helveczia/templates/actor/dialogs/roll-virtue.hbs',
    // Actor Partials
    'systems/helveczia/templates/actor/partials/actor-abilities.hbs',
    'systems/helveczia/templates/actor/partials/actor-combat.hbs',
    'systems/helveczia/templates/actor/partials/actor-deeds.hbs',
    'systems/helveczia/templates/actor/partials/actor-skills.hbs',
    'systems/helveczia/templates/actor/partials/actor-effects.hbs',
    'systems/helveczia/templates/actor/partials/actor-equipment.hbs',
    'systems/helveczia/templates/actor/partials/actor-notes.hbs',
    'systems/helveczia/templates/actor/partials/character-header.hbs',
    'systems/helveczia/templates/actor/partials/character-nav.hbs',
    'systems/helveczia/templates/actor/partials/cleric.hbs',
    'systems/helveczia/templates/actor/partials/fighter.hbs',
    'systems/helveczia/templates/actor/partials/npc-equipment.hbs',
    'systems/helveczia/templates/actor/partials/npc-header.hbs',
    'systems/helveczia/templates/actor/partials/npc-nav.hbs',
    'systems/helveczia/templates/actor/partials/npc-saves.hbs',
    'systems/helveczia/templates/actor/partials/npc-skills.hbs',
    'systems/helveczia/templates/actor/partials/party-sheet-header.hbs',
    'systems/helveczia/templates/actor/partials/party-sheet.hbs',
    'systems/helveczia/templates/actor/partials/spells.hbs',
    'systems/helveczia/templates/actor/partials/student.hbs',
    'systems/helveczia/templates/actor/partials/vagabond.hbs',
    // Bible
    'systems/helveczia/templates/bible/bible.hbs',
    // Cards
    'systems/helveczia/templates/cards/cards-hand.hbs',
    'systems/helveczia/templates/cards/cards-pile.hbs',
    'systems/helveczia/templates/cards/dialog-draw.hbs',
    'systems/helveczia/templates/cards/dialog-generate.hbs',
    'systems/helveczia/templates/cards/dialog-play.hbs',
    // Chat
    'systems/helveczia/templates/chat/bible-choose.hbs',
    'systems/helveczia/templates/chat/bible-verse.hbs',
    'systems/helveczia/templates/chat/cast-spell.hbs',
    'systems/helveczia/templates/chat/hungarian-fate.hbs',
    'systems/helveczia/templates/chat/roll-ability.hbs',
    'systems/helveczia/templates/chat/roll-absolution.hbs',
    'systems/helveczia/templates/chat/roll-attack.hbs',
    'systems/helveczia/templates/chat/roll-creation.hbs',
    'systems/helveczia/templates/chat/roll-crit.hbs',
    'systems/helveczia/templates/chat/roll-dialog.hbs',
    'systems/helveczia/templates/chat/roll-hitpoints.hbs',
    // Item Sheets
    'systems/helveczia/templates/item/armour-sheet-header.hbs',
    'systems/helveczia/templates/item/book-sheet-header.hbs',
    'systems/helveczia/templates/item/book-sheet-spells.hbs',
    'systems/helveczia/templates/item/class-sheet-header.hbs',
    'systems/helveczia/templates/item/deed-sheet-header.hbs',
    'systems/helveczia/templates/item/people-sheet-header.hbs',
    'systems/helveczia/templates/item/possession-sheet-header.hbs',
    'systems/helveczia/templates/item/skill-sheet-header.hbs',
    'systems/helveczia/templates/item/spell-sheet-header.hbs',
    'systems/helveczia/templates/item/weapon-sheet-header.hbs',
    'systems/helveczia/templates/item/weapon-sheet-damage.hbs',
    // Item Partials
    'systems/helveczia/templates/item/partials/item-effects.hbs',
    'systems/helveczia/templates/item/partials/item-nav.hbs',
    'systems/helveczia/templates/item/partials/item-notes.hbs',
    // Names
    'systems/helveczia/templates/names/dialog-name.hbs',
    // Licesne
    'systems/helveczia/templates/license.html',
  ];

  return loadTemplates(templatePaths);
}
