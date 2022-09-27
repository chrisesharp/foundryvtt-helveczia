export async function preloadTemplates(): Promise<Handlebars.TemplateDelegate[]> {
  const templatePaths: string[] = [
    // Add paths to 'systems/helveczia/templates'
    // Actor Sheets
    'systems/helveczia/templates/actor/character-sheet.hbs',
    'systems/helveczia/templates/actor/npc-sheet.hbs',
    'systems/helveczia/templates/actor/party-sheet.hbs',
    // Actor Partials
    'systems/helveczia/templates/actor/partials/actor-header.hbs',
    'systems/helveczia/templates/actor/partials/actor-abilities.hbs',
    'systems/helveczia/templates/actor/partials/actor-skills.hbs',
    'systems/helveczia/templates/actor/partials/actor-combat.hbs',
    'systems/helveczia/templates/actor/partials/actor-equipment.hbs',
    'systems/helveczia/templates/actor/partials/actor-deeds.hbs',
    'systems/helveczia/templates/actor/partials/actor-effects.hbs',
    'systems/helveczia/templates/actor/partials/fighter.hbs',
    'systems/helveczia/templates/actor/partials/vagabond.hbs',
    'systems/helveczia/templates/actor/partials/cleric.hbs',
    'systems/helveczia/templates/actor/partials/student.hbs',
    'systems/helveczia/templates/actor/partials/spells.hbs',
    'systems/helveczia/templates/actor/partials/npc-header.hbs',
    'systems/helveczia/templates/actor/partials/npc-saves.hbs',
    'systems/helveczia/templates/actor/partials/npc-combat.hbs',
    'systems/helveczia/templates/actor/partials/npc-equipment.hbs',
    'systems/helveczia/templates/actor/partials/npc-skills.hbs',
    // Item Sheets
    'systems/helveczia/templates/item/armour-sheet.hbs',
    'systems/helveczia/templates/item/class-sheet.hbs',
    'systems/helveczia/templates/item/deed-sheet.hbs',
    'systems/helveczia/templates/item/people-sheet.hbs',
    'systems/helveczia/templates/item/possession-sheet.hbs',
    'systems/helveczia/templates/item/skill-sheet.hbs',
    'systems/helveczia/templates/item/weapon-sheet.hbs',
    'systems/helveczia/templates/item/spell-sheet.hbs',
    'systems/helveczia/templates/item/book-sheet.hbs',
    // Item Partials
    'systems/helveczia/templates/item/partials/item-effects.hbs',
    'systems/helveczia/templates/item/partials/item-nav.hbs',
    // Card Sheets
    'systems/helveczia/templates/cards/cards-hand.hbs',
    'systems/helveczia/templates/cards/dialog-play.hbs',
  ];

  return loadTemplates(templatePaths);
}
