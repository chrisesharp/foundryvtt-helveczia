import { books } from '../../../assets/holy-bible/books';
import { marked } from 'marked';

class Slugger {
  private seen = {};
  constructor() {
    this.seen = {};
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
  private index = 0;

  // eslint-disable-next-line @typescript-eslint/ban-types
  constructor(object: {}, options?: any) {
    super(object, options);
    this.random();
  }

  get title() {
    return game.i18n.localize('HV.apps.bible.name');
  }

  static get defaultOptions() {
    const options = super.defaultOptions;
    (options.classes = ['helveczia', 'dialog', 'creator']), (options.id = 'holy-bible');
    options.template = 'systems/helveczia/templates/bible/bible.hbs';
    options.width = 450;
    options.height = 450;
    options.resizable = true;
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

  next() {
    if (this.index < books.length - 1) {
      this.index += 1;
      this.book = books[this.index];
    }
  }

  random() {
    this.index = Math.floor(Math.random() * books.length);
    this.book = books[this.index];
  }

  activateListeners(html) {
    super.activateListeners(html);
    marked.use({ renderer });
    html.find('.next').click((ev) => {
      ev.preventDefault();
      this.next();
      this.render(true);
    });
    html.find('.rnd').click((ev) => {
      ev.preventDefault();
      this.random();
      this.render(true);
    });
    html.find('#chapter').load(this.current, (response) => {
      const content = marked.parse(response);
      $('#chapter').html(content);
    });
  }
}
