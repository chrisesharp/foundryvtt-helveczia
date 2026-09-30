export {};

// Forward declarations for foundry namespace structure
interface FoundryApplicationV2 {
  options: Record<string, any>;
  element: HTMLElement;
  position: { top: number; left: number; width: number | 'auto'; height: number | 'auto' };
  tabGroups: Record<string, string>;
  isEditable: boolean;
  document: any;
  rendered: boolean;
  render(force?: boolean, options?: Record<string, any>): Promise<any>;
  close(options?: Record<string, any>): Promise<void>;
  [key: string]: any;
}
interface FoundryApplicationV2Constructor extends Function {
  new (...args: any[]): FoundryApplicationV2;
  [key: string]: any;
}
interface FoundryActorSheetV2 extends FoundryApplicationV2 {
  actor: any;
  [key: string]: any;
}
interface FoundryActorSheetV2Constructor extends Function {
  new (...args: any[]): FoundryActorSheetV2;
  [key: string]: any;
}
interface FoundryItemSheetV2 extends FoundryApplicationV2 {
  item: any;
  actor: any;
  [key: string]: any;
}
interface FoundryItemSheetV2Constructor extends Function {
  new (...args: any[]): FoundryItemSheetV2;
  [key: string]: any;
}

declare global {
  // Global Foundry namespaces and singletons
  const foundry: {
    applications: {
      api: {
        ApplicationV2: FoundryApplicationV2Constructor;
        HandlebarsApplicationMixin<T extends abstract new (...args: any[]) => any>(
          Base: T,
        ): T & {
          new (...args: any[]): FoundryApplicationV2 & { actor: any; item: any };
          [key: string]: any;
        };
        DialogV2: { wait(options: any): Promise<any>; [key: string]: any };
        [key: string]: any;
      };
      sheets: {
        ActorSheetV2: FoundryActorSheetV2Constructor;
        ItemSheetV2: FoundryItemSheetV2Constructor;
        SceneConfig: { new (...args: any[]): any; [key: string]: any };
        [key: string]: any;
      };
      handlebars: {
        renderTemplate(path: string, data?: any): Promise<string>;
        [key: string]: any;
      };
      ux: {
        DragDrop: { new (...args: any[]): any; [key: string]: any };
        TextEditor: { enrichHTML(content: string, options?: any): Promise<string>; [key: string]: any };
        [key: string]: any;
      };
      [key: string]: any;
    };
    utils: {
      fromUuid(uuid: string): Promise<any>;
      fromUuidSync(uuid: string): any;
      [key: string]: any;
    };
    abstract: {
      Document: {
        ModificationContext: any;
        Any: any;
        [key: string]: any;
      };
      [key: string]: any;
    };
    documents: {
      BaseUser: any;
      [key: string]: any;
    };
    helpers: {
      Hooks: any;
      [key: string]: any;
    };
    [key: string]: any;
  };
  const CONST: any;
  const game: any;
  const ui: any;
  const canvas: any;

  // Namespace declaration for type references like foundry.documents.BaseUser
  namespace foundry {
    namespace documents {
      type BaseUser = any;
      type BaseActor = any;
      type BaseItem = any;
    }
    namespace abstract {
      namespace Document {
        type Any = any;
        type ModificationContext<T = any> = any;
      }
    }
    namespace utils {
      function fromUuid(uuid: string): Promise<any>;
      function fromUuidSync(uuid: string): any;
      function mergeObject(original: any, other: any, options?: any): any;
      function deepClone<T>(original: T): T;
    }
    namespace helpers {
      class Hooks {
        [key: string]: any;
      }
    }
  }

  // Global Foundry document classes — declared as classes so interface augmentation works
  declare class Actor {
    name: string;
    type: string;
    id: string | null;
    uuid: string;
    system: any;
    items: {
      contents: Item[];
      get(id: string): Item | null;
      getName(name: string): Item | null;
      filter(fn: (i: Item) => boolean): Item[];
    };
    effects: {
      contents: any[];
      get(id: string): any;
      filter(fn: (e: any) => boolean): any[];
    };
    sheet: any;
    isOwner: boolean;
    hasPlayerOwner: boolean;
    limited: boolean;
    flags: Record<string, Record<string, unknown>>;
    prototypeToken: any;
    allApplicableEffects(): Iterable<any>;
    testUserPermission(user: any, permission: any): boolean;
    getFlag(scope: string, key: string): unknown;
    setFlag(scope: string, key: string, value: unknown): Promise<any>;
    unsetFlag(scope: string, key: string): Promise<any>;
    update(data: Record<string, unknown>, options?: Record<string, unknown>): Promise<any>;
    createEmbeddedDocuments(type: string, data: any[], options?: Record<string, unknown>): Promise<any[]>;
    deleteEmbeddedDocuments(type: string, ids: string[], options?: Record<string, unknown>): Promise<any[]>;
    getRollData(): Record<string, unknown>;
    itemTypes: Record<string, any[]>;
    [key: string]: any;
  }

  declare class Item {
    name: string;
    type: string;
    id: string | null;
    uuid: string;
    system: any;
    effects: {
      contents: any[];
      get(id: string): any;
      filter(fn: (e: any) => boolean): any[];
    };
    actor: Actor | null;
    isOwner: boolean;
    isEmbedded: boolean;
    link: string;
    sort: number;
    flags: Record<string, Record<string, unknown>>;
    getFlag(scope: string, key: string): unknown;
    setFlag(scope: string, key: string, value: unknown): Promise<any>;
    unsetFlag(scope: string, key: string): Promise<any>;
    update(data: Record<string, unknown>, options?: Record<string, unknown>): Promise<any>;
    toDragData(): Record<string, unknown>;
    getRollData(): Record<string, unknown>;
    [key: string]: any;
  }

  declare class Cards {
    static createDocuments(data?: any[], options?: any): Promise<Cards[]>;
    static [key: string]: any;
    name: string;
    type: string;
    folder: any;
    [key: string]: any;
  }

  declare class Card {
    [key: string]: any;
  }

  declare class Roll<T = any> {
    constructor(formula: string, data?: Record<string, unknown>, options?: any);
    result: any;
    total: any;
    terms: any[];
    static fromTerms(terms: any[], options?: any): Roll<any>;
    static roll(formula: string, data?: any, options?: any): Promise<Roll<any>>;
    evaluate(options?: any): Promise<Roll<T>>;
    toMessage(messageData?: any, options?: any): Promise<any>;
    [key: string]: any;
  }

  declare class Dialog {
    [key: string]: any;
  }

  declare class ChatMessage {
    static create(data: any, options?: any): Promise<ChatMessage | undefined>;
    static getSpeaker(options?: any): any;
    static getWhisperRecipients(name: string): any[];
    [key: string]: any;
  }

  declare class Die {
    [key: string]: any;
  }

  declare class Combat {
    [key: string]: any;
  }

  // User — interface so it can merge with the game.user type from foundry
  interface User {
    name: string;
    id: string;
    isGM: boolean;
    character: Actor | null;
    [key: string]: any;
  }

  type EmptyObject = Record<string, never>;
  type StoredDocument<T> = T;
  type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };
  type ActorSheet = any;

  // DocumentModificationContext — global alias (replaces foundry-types.ts module)
  type DocumentModificationContext =
    foundry.abstract.Document.ModificationContext<foundry.abstract.Document.Any | null>;

  // Global helper classes
  declare class Hooks extends foundry.helpers.Hooks {
    static on(event: string, fn: (...args: any[]) => any): number;
    static once(event: string, fn: (...args: any[]) => any): number;
    static off(event: string, id: number): void;
    static call(event: string, ...args: any[]): boolean;
    static callAll(event: string, ...args: any[]): boolean;
  }

  // --- Additional global document types ---
  const Combatant: any;
  type Combatant = any;

  const TokenDocument: any;
  type TokenDocument = any;

  const ActiveEffect: any;
  type ActiveEffect = {
    id: string | null;
    name: string;
    disabled: boolean;
    origin: string;
    update(data: any): Promise<any>;
  };

  const CompendiumCollection: any;
  type CompendiumCollection<T> = {
    metadata: { name: string; label: string };
    find(fn: (doc: T) => boolean): T | undefined;
    getDocument(id: string): Promise<T | null>;
    importAll(options?: any): Promise<T[]>;
    [key: string]: any;
  };

  // --- CONFIG augmentation ---
  namespace globalThis {
    namespace CONFIG {
      let HV: import('../config').HelvecziaConfig;
      let debug: { hooks: boolean };
      let Actor: { documentClass: any; dataModels: any };
      let Item: { documentClass: any; dataModels: any };
      let Token: { objectClass: any };
      let Combatant: { documentClass: any };
      let Combat: { documentClass: any; initiative: any };
      let sounds: { dice: string; [key: string]: any };
      let ChatMessage: { modes: Record<string, string>; documentClass: any; [key: string]: any };
      let Dice: { [key: string]: any };
      let ActiveEffect: { documentClass: any };
    }

    interface System {
      id: string;
      version: string;
    }
  }

  // --- Localization augmentation ---
  interface Localization {
    localize(key: string): string;
    format(key: string, data?: Record<string, unknown>): string;
  }

  // --- Handlebars global namespace ---
  namespace Handlebars {
    function registerHelper(name: string, fn: (...args: any[]) => any): void;
    function registerPartial(name: string, partial: string): void;
    function compile(template: string, options?: any): (context: any) => string;
    type TemplateDelegate<T = any> = (context: T, options?: any) => string;
  }

  // --- Scene flags augmentation ---
  interface Scene {
    flags: Record<string, Record<string, unknown>>;
  }

  // --- Canvas tokens augmentation ---
  interface Canvas {
    tokens: any;
    hud: any;
    scene: any;
  }
}
