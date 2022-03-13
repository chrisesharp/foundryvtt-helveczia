export async function preloadTemplates(): Promise<Handlebars.TemplateDelegate[]> {
  const templatePaths: string[] = [
    // Add paths to 'systems/helveczia/templates'
    // Actor Sheets
    'systems/helveczia/templates/actor/character-sheet.hbs',
    // Actor Partials
    'systems/helveczia/templates/actor/partials/actor-header.hbs',
    'systems/helveczia/templates/actor/partials/actor-abilities.hbs',
    'systems/helveczia/templates/actor/partials/actor-skills.hbs',
    // Item Sheets
    'systems/helveczia/templates/item/skill-sheet.hbs',
    // Item Partials
    'systems/helveczia/templates/item/partials/item-effects.hbs',
  ];

  return loadTemplates(templatePaths);
}
