import { books } from '../../../assets/holy-bible/books';
import { marked } from 'marked';
import { HVActor } from '../../actor/actor';

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

export class KJVBible extends FormApplication {
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
    return game.i18n.localize('HV.apps.bible.name');
  }

  static get defaultOptions() {
    const options = super.defaultOptions;
    (options.classes = ['helveczia', 'dialog', 'creator']), (options.id = 'holy-bible');
    options.template = 'systems/helveczia/templates/bible/bible.hbs';
    options.width = 450;
    options.height = 350;
    options.resizable = false;
    return options;
  }

  async getData() {
    const data: any = foundry.utils.deepClone(super.getData());
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

  activateListeners(html) {
    super.activateListeners(html);
    const verseId = `li#verse-${this.verse}`;

    marked.use({ renderer });

    html.find('.prev-verse').click((ev) => {
      ev.preventDefault();
      this.previousVerse();
      this.render(true);
    });

    html.find('.next-verse').click((ev) => {
      ev.preventDefault();
      this.nextVerse();
      this.render(true);
    });

    html.find('.rnd').click((ev) => {
      ev.preventDefault();
      this.seekGuidance();
    });

    html.find('.send').click((ev) => {
      ev.preventDefault();
      this.sendVerse();
    });

    html.find('.chapter').load(this.current, (response) => {
      this.content = marked.parse(response);
      const chapter = $('#chapter');
      this.occurrences = slugger.occurrences;
      chapter.html(this.content).find(verseId).addClass('highlighted');
      const chapterTop = (chapter.offset() as JQueryCoordinates).top;
      const verseTop = ($(verseId).offset() as JQueryCoordinates).top;
      chapter.scrollTop(verseTop - chapterTop - 70);
      this.chapter = chapter.children('h1').eq(0).text();
    });
  }
}
