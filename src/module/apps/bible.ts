import { books } from '../../assets/holy-bible/books';
import { marked } from 'marked';
import { HVActor } from '../actor/actor';
import { EmptyObject } from '@league-of-foundry-developers/foundry-vtt-types/src/types/utils.mjs';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const { renderTemplate } = foundry.applications.handlebars;

class Slugger {
  private seen = {};
  public occurrences: number;

  constructor() {
    this.seen = {};
    this.occurrences = 1;
  }

  serialize(value) {
    return (
      value
        .toLowerCase()
        .trim()
        // remove html tags
        .replace(/<[!\/a-z].*?>/gi, '')
        // remove unwanted chars
        .replace(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,./:;<=>?@[\]^`{|}~]/g, '')
        .replace(/\s/g, '-')
    );
  }

  getNextSafeSlug(originalSlug) {
    let occurenceAccumulator = 1;
    let slug = originalSlug + '-' + occurenceAccumulator;

    if (this.seen.hasOwnProperty(slug)) {
      occurenceAccumulator = this.seen[originalSlug];
      do {
        occurenceAccumulator++;
        slug = originalSlug + '-' + occurenceAccumulator;
      } while (this.seen.hasOwnProperty(slug));
    }
    this.seen[originalSlug] = occurenceAccumulator;
    this.seen[slug] = 0;
    this.occurrences = occurenceAccumulator;
    return slug;
  }

  slug(value) {
    const slug = this.serialize(value);
    return this.getNextSafeSlug(slug);
  }

  reset() {
    this.seen = {};
  }
}
const slugger = new Slugger();
const renderer = {
  listitem(text, _task, _checked) {
    const id = slugger.slug('verse');
    return `<li id="${id}">${text}</li>`;
  },
  list(body, ordered, start) {
    slugger.reset();
    const type = ordered ? 'ol' : 'ul',
      startatt = ordered && start !== 1 ? ' start="' + start + '"' : '';
    return '<' + type + startatt + '>\n' + body + '</' + type + '>\n';
  },
};

async function fetchHtmlAsText(url) {
  return await (await fetch(url)).text();
}

export class KJVBible extends HandlebarsApplicationMixin(ApplicationV2) {
  private book = '';
  private chapter = '';
  private verse = 1;
  private occurrences = 1;
  private index = 0;
  private content = '';

  // eslint-disable-next-line @typescript-eslint/ban-types
  constructor(object: {}, options?: any) {
    super(object, options);
  }

  async seekGuidance(actor?: HVActor) {
    const speaker = ChatMessage.getSpeaker({ actor: actor });
    const templateData = {
      config: CONFIG.HV,
      speaker: speaker.alias,
      text: '<h3>seeking guidance from the Holy Writ...</h3>',
      title: 'Seeking guidance...',
    };
    const content = await renderTemplate('systems/helveczia/templates/chat/bible-choose.hbs', templateData);
    ChatMessage.create({
      content: content,
      blind: false,
    });
    this.random();
    this.render(true);
  }

  get title() {
    return game.i18n.localize(this.options.window.title);
  }

  static DEFAULT_OPTIONS = {
    id: 'holy-bible',
    classes: ['helveczia'],
    form: {
      handler: KJVBible.onSubmit,
      closeOnSubmit: true,
    },
    tag: 'form',
    position: {
      width: 450,
      height: 350,
    },
    window: {
      title: 'HV.apps.bible.name',
      resizable: false,
      contentClasses: ['helveczia', 'dialog', 'creator'],
    },
  };

  static PARTS = {
    helveczia: {
      template: 'systems/helveczia/templates/bible/bible.hbs',
    },
  };

  protected async _prepareContext(options: {
    force?: boolean | undefined;
    position?:
      | {
          top?: number | undefined;
          left?: number | undefined;
          width?: number | 'auto' | undefined;
          height?: number | 'auto' | undefined;
          scale?: number | undefined;
          zIndex?: number | undefined;
        }
      | undefined;
    window?:
      | { title?: string | undefined; icon?: string | false | undefined; controls?: boolean | undefined }
      | undefined;
    parts?: string[] | undefined;
    isFirstRender?: boolean | undefined;
  }): Promise<EmptyObject> {
    const data: any = foundry.utils.deepClone(super._prepareContext(options));
    data.user = game.user;
    data.config = CONFIG.HV;
    data.chapter = this.current;
    return data;
  }

  /**
   * This method is called upon form submission after form data is validated
   * @param event {Event}       The initial triggering submission event
   * @param formData {Object}   The object of validated form data with which to update the object
   * @private
   */
  async _updateObject(event: Event, _formData: object) {
    event.preventDefault();
  }

  get current() {
    return `systems/helveczia/assets/holy-bible/${this.book}`;
  }

  async sendVerse() {
    const templateData = {
      config: CONFIG.HV,
      chapter: this.chapter,
      verse: this.verse,
      text: $(this.content).find(`li#verse-${this.verse}`).html(),
      title: 'The Holy Writ guides...',
    };
    const content = await renderTemplate('systems/helveczia/templates/chat/bible-verse.hbs', templateData);
    ChatMessage.create({
      content: content,
      blind: false,
    });
  }

  previousVerse() {
    this.verse = Math.max(1, this.verse - 1);
  }

  nextVerse() {
    this.verse += 1;
    if (this.verse > this.occurrences) this.nextChapter();
  }

  nextChapter() {
    if (this.index < books.length - 1) {
      this.index += 1;
      this.book = books[this.index];
      this.verse = 1;
    }
  }

  random() {
    this.index = Math.floor(Math.random() * books.length);
    this.book = books[this.index];
    this.occurrences = 1;
    this.verse = 1;
  }

  async _onRender(_context, _options) {
    const verseId = `li#verse-${this.verse}`;
    marked.use({ renderer });

    this.element.querySelector('.prev-verse')?.addEventListener('click', (ev) => {
      ev.preventDefault();
      this.previousVerse();
      this.render(true);
    });

    this.element.querySelector('.next-verse')?.addEventListener('click', (ev) => {
      ev.preventDefault();
      this.nextVerse();
      this.render(true);
    });

    this.element.querySelector('.rnd')?.addEventListener('click', (ev) => {
      ev.preventDefault();
      this.seekGuidance();
    });

    this.element.querySelector('.send')?.addEventListener('click', (ev) => {
      ev.preventDefault();
      this.sendVerse();
    });

    this.content = marked.parse(await fetchHtmlAsText(this.current));
    this.occurrences = slugger.occurrences;
    const chapter = this.element.querySelector('#chapter');
    if (chapter) {
      chapter.innerHTML = this.content;
      const verse = chapter.querySelector(verseId);
      if (verse) {
        verse.classList.add('highlighted');
        chapter.scrollTo({
          top: verse.offsetTop - chapter.offsetTop - 70,
        });
        this.chapter = chapter.querySelector('h1')?.innerHTML ?? '';
      }
    }
  }

  // async onSubmit(event, form, formData) {
  //   const settings = foundry.utils.expandObject(formData.object);
  //   // await Promise.all(Object.entries(settings).map(([key, value]) => game.settings.set('helveczia', key, value)));
  // }
}
