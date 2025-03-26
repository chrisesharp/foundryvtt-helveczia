import { prepareActiveEffectCategories } from '../effects';
import { HVItem } from './item';
import { BookItemData } from './item-types';
const { ItemSheetV2 } = foundry.applications.sheets;
const { DragDrop } = foundry.applications.ux;
const { HandlebarsApplicationMixin } = foundry.applications.api;

export class HVItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  constructor(options = {}) {
    super(options);
    this.#dragDrop = this.#createDragDropHandlers();
  }

  static DEFAULT_OPTIONS = {
    classes: ['helveczia', 'sheet', 'item'],
    position: {
      width: 450,
      height: 500,
    },
    actions: {
      // actor: HVPartySheet.getActorSheet,
    },
    window: {
      resizable: true,
    },
    dragDrop: [{ dragSelector: '[data-drag]', dropSelector: null }],
    form: {
      submitOnChange: true,
    },
  };

  async _prepareContext(options) {
    let data = await super._prepareContext(options);
    data = (await CONFIG.HV.itemClasses[this.item.type]?.getSheetData(data, this)) || data;
    data.item = this.item;
    data.data = this.item.system;
    data.isGM = game.user?.isGM;
    data.config = CONFIG.HV;
    data.effects = prepareActiveEffectCategories(this.item.effects);
    data.tabs = this._getTabs(options.parts);
    return data;
  }

  _getTabs(parts) {
    const tabGroup = 'primary';
    if (!this.tabGroups[tabGroup]) this.tabGroups[tabGroup] = 'notes';
    return parts.reduce((tabs, partId) => {
      const tab = {
        cssClass: '',
        group: tabGroup,
        // Matches tab property to
        id: '',
        // FontAwesome Icon, if you so choose
        icon: '',
        // Run through localization
        label: 'HV.tabs.',
      };
      switch (partId) {
        case 'header':
        case 'tabs':
          return tabs;
        default:
          tab.id = partId;
          tab.label += partId;
          break;
      }
      if (this.tabGroups[tabGroup] === tab.id) tab.cssClass = 'active';
      tabs[partId] = tab;
      return tabs;
    }, {});
  }

  /** @override */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    options.parts = ['header', 'tabs', 'notes'];
    if (this.document.limited) return;
    if (this.document.type === 'book') options.parts.push('spells');
    if (this.document.type === 'weapon') options.parts.push('damage');
    if (game.settings?.get('helveczia', 'effects') && game.user.isGM) {
      options.parts.push('effects');
    }
  }

  /** @override */
  async _preparePartContext(partId, context) {
    switch (partId) {
      case 'notes':
        context.tab = context.tabs[partId];
        context.enrichedDescription = await TextEditor.enrichHTML(this.item.system.description, {
          secrets: this.document.isOwner,
          rollData: this.item.getRollData(),
          // Relative UUID resolution
          relativeTo: this.item,
        });
        break;
      case 'effects':
        context.tab = context.tabs[partId];
        break;
      default:
        context.tab = context.tabs[partId];
        break;
    }
    return context;
  }

  _onRender(_context, _options) {
    this.#dragDrop.forEach((d) => d.bind(this.element));
    // You may want to add other special handling here
    // Foundry comes with a large number of utility classes, e.g. SearchFilter
    // That you may want to implement yourself.
  }

  /** @override */
  async _onDragStart(event) {
    const div = event.currentTarget;
    // Create drag data
    const dragData = {};
    const itemId = div.dataset.itemId;
    // Owned Items
    if (itemId) {
      let item = game.items?.get(itemId);
      if (!item) {
        const pack = game.packs.get('helveczia.spells');
        item = ((await pack?.getDocument(itemId)) as StoredDocument<HVItem>) ?? undefined;
      }
      dragData['type'] = 'Item';
      dragData['data'] = item?.data;
    }
    if (Object.keys(dragData).length === 0) return;
    // Set data transfer
    event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
  }

  async _onDropItem(_event, data) {
    if (!this.isEditable) return false;
    const link = (await TextEditor.getContentLink(data)) ?? '';
    const myRe = new RegExp('{(.*?)}', 'g');
    const result = myRe.exec(link);

    const name = result && result.length > 1 ? result[1] : undefined;

    if (name) {
      const spells = foundry.utils.duplicate((this.item.system as BookItemData).spells);
      spells.push({ id: link, name: name });
      return this.item.update({ system: { spells: spells } });
    }
    return;
  }

  onDropAllow(_actor, data): boolean {
    return data.type === 'Item';
  }

  /**
   * Define whether a user is able to begin a dragstart workflow for a given drag selector
   * @param {string} selector       The candidate HTML selector for dragging
   * @returns {boolean}             Can the current user drag this selector?
   * @protected
   */
  _canDragStart(_selector) {
    // game.user fetches the current user
    return this.isEditable;
  }

  /**
   * Define whether a user is able to conclude a drag-and-drop workflow for a given drop selector
   * @param {string} selector       The candidate HTML selector for the drop target
   * @returns {boolean}             Can the current user drop on this selector?
   * @protected
   */
  _canDragDrop(_selector) {
    // game.user fetches the current user
    return this.isEditable;
  }

  /**
   * Callback actions which occur when a dragged element is over a drop target.
   * @param {DragEvent} event       The originating DragEvent
   * @protected
   */
  _onDragOver(_event) {}

  /**
   * Callback actions which occur when a dragged element is dropped on a target.
   * @param {DragEvent} event       The originating DragEvent
   * @protected
   */
  async _onDrop(event) {
    const data = TextEditor.getDragEventData(event);
    const item = this.item;
    const allowed = Hooks.call('dropItemSheetData', item, this, data);
    if (!allowed) return;

    // Handle different data types
    switch (data.type) {
      case 'Item':
        return this._onDropItem(event, data);
      // case 'Folder':
      //   return this._onDropFolder(event, data);
      default:
        return;
    }
  }

  /**
   * Returns an array of DragDrop instances
   * @type {DragDrop[]}
   */
  get dragDrop() {
    return this.#dragDrop;
  }

  // This is marked as private because there's no real need
  // for subclasses or external hooks to mess with it directly
  #dragDrop;

  /**
   * Create drag-and-drop workflow handlers for this Application
   * @returns {DragDrop[]}     An array of DragDrop handlers
   * @private
   */
  #createDragDropHandlers() {
    return this.options.dragDrop.map((d) => {
      d.permissions = {
        dragstart: this._canDragStart.bind(this),
        drop: this._canDragDrop.bind(this),
      };
      d.callbacks = {
        dragstart: this._onDragStart.bind(this),
        dragover: this._onDragOver.bind(this),
        drop: this._onDrop.bind(this),
      };
      return new DragDrop(d);
    });
  }

  static async _effectToggle(_event, target) {
    const effect = this._getEffect(target);
    await effect.update({ disabled: !effect.disabled });
  }

  _getEffect(target) {
    const li = target.closest('.effect');
    return this.item.effects.get(li?.dataset?.effectId);
  }
}
