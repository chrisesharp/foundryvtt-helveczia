import { jsPDF, jsPDFOptions } from 'jspdf';
import { HVActor } from './actor/actor';
import { HVActorSheet } from './actor/actor-sheet';
import { HVItem } from './items/item';
const { fromUuid } = foundry.utils;

const pages = [
  'systems/helveczia/assets/empty_frame.png',
  'systems/helveczia/assets/char-sheet/sheet-1.png',
  'systems/helveczia/assets/char-sheet/sheet-2.png',
  'systems/helveczia/assets/char-sheet/sheet-3.png',
  'systems/helveczia/assets/char-sheet/sheet-4.png',
];

type character = {
  actor: HVActor;
  title: string;
  initBonus: string;
  strBonus: string;
  conBonus: string;
  wisBonus: string;
  dexBonus: string;
  chaBonus: string;
  intBonus: string;
  bravery: string;
  braveryBase: string;
  braveryBonus: string;
  deftness: string;
  deftnessBase: string;
  deftnessBonus: string;
  temptation: string;
  temptationBase: string;
  temptationBonus: string;
  melee: string;
  ranged: string;
  cc: string;
};

function plusminus(value) {
  return value > 0 ? `+${value}` : `${value}`;
}

function wordwrap(text: string, cols: number): string[] {
  return wrap(text, cols).split('\n');
}

function wrap(line, cols) {
  if (line.length <= cols) return line;
  const result: [string, string] = getBreakPoints(line, cols);
  return result[0] + '\n' + wrap(result[1], cols);
}

function getBreakPoints(line, cols): [string, string] {
  const breakPt = line.lastIndexOf(' ', cols + 1);
  if (breakPt >= 0) return [line.slice(0, breakPt), line.slice(breakPt + 1)];
  else return [line.slice(0, cols), line.slice(cols)];
}

export class HVPDF {
  doc: jsPDF;
  x = 0;
  y = 0;
  char: character;
  sheet: HVActorSheet;
  specialisms: HVItem[];

  constructor(character, sheet) {
    const pdfOpts: jsPDFOptions = {
      orientation: 'portrait',
    };
    this.doc = new jsPDF(pdfOpts);
    this.char = character;
    this.sheet = sheet;
    this.specialisms = this.char.actor.itemTypes['class'].filter((i) => i.system.specialism === true);
  }

  async printOfficial() {
    this.doc.setFontSize(14);
    await this.printPage1();
    await this.printPage2();
    await this.printSpellsPage();
  }

  async printPage1(): Promise<void> {
    let x = 0;
    let y = 0;

    this.doc.addImage({
      imageData: pages[1],
      x: x,
      y: y,
      width: 210,
      height: 295,
    });

    x = 20;
    y = 38;
    this.doc.text(`${this.char.actor.name}, ${this.char.title}`, x, y);

    this.doc.setFontSize(12);
    x = 52;
    y = 66;
    this.printStats(x, y);
    this.printMiddle(x, y);
    this.printSaves(x, y);
    await this.printCombat(x, y);
    await this.printSpecials(x, y);

    x = 20;
    await this.printSkills(x, y + 86);
    this.printVal(x + 15, y + 123, `${this.char.actor.system.experience}`);
    this.printWealth(x, y);
    await this.printPossessions(x, y + 169);
  }

  async printPage2(): Promise<void> {
    this.doc.addPage();
    const fontSize = this.doc.getFontSize();
    this.doc.setFontSize(fontSize - 2);
    this.doc.addImage({
      imageData: pages[2],
      x: 0,
      y: 0,
      width: 210,
      height: 295,
    });
    await this.printNotes(25, 38);
    await this.printDeeds(35, 180);
    this.doc.setFontSize(fontSize);
  }

  async printSpellsPage(): Promise<void> {
    const memorized = this.char.actor.itemTypes['spell'];
    const spellbooks = this.char.actor.itemTypes['book']
      .filter((i) => i.system.spells.length > 0)
      .map((i) => i.system.spells)
      .flat();
    if (spellbooks.length) {
      for (const i of spellbooks) {
        const uuid = i.id.replace('@UUID[', '').split(']')[0];
        const spell = (await fromUuid(uuid)) as HVItem;
        if (spell) memorized.push(spell);
      }
    }
    const allSpellNames = new Set(memorized.map((i) => i.name ?? ''));
    const allSpells: HVItem[] = [];
    for (const spell of memorized) {
      if (spell.name && allSpellNames.has(spell.name)) {
        allSpells.push(spell);
        allSpellNames.delete(spell.name);
      }
    }
    if (allSpells.length) {
      const fontSize = this.doc.getFontSize();
      this.doc.setFontSize(fontSize - 2);
      await this.printSpells(
        25,
        108,
        3,
        allSpells.sort((a, b) => a.system.level - b.system.level),
      );
      this.doc.setFontSize(fontSize);
    }
  }

  printStats(x: number, y: number): void {
    this.printAttribute(x, y, `${this.char.actor.system.scores.str.value}`, this.char.strBonus);
    this.printAttribute(x, y + 6, `${this.char.actor.system.scores.dex.value}`, this.char.dexBonus);
    this.printAttribute(x, y + 11, `${this.char.actor.system.scores.con.value}`, this.char.conBonus);
    this.printAttribute(x, y + 17, `${this.char.actor.system.scores.int.value}`, this.char.intBonus);
    this.printAttribute(x, y + 23, `${this.char.actor.system.scores.wis.value}`, this.char.wisBonus);
    this.printAttribute(x, y + 29, `${this.char.actor.system.scores.cha.value}`, this.char.chaBonus);
  }

  printMiddle(x: number, y: number): void {
    this.printVal(x + 65, y, this.char.initBonus);
    this.printVal(x + 30, y + 5, `${this.char.actor.system.ac}`);
    this.printArmour(x + 23, y + 10);
    this.printVal(x + 30, y + 17, `${this.char.actor.system.hp.value}`);
  }

  printSaves(x: number, y: number): void {
    this.printTriple(x + 105, y, this.char.bravery, this.char.braveryBase, this.char.braveryBonus);
    this.printTriple(x + 105, y + 5, this.char.deftness, this.char.deftnessBase, this.char.deftnessBonus);
    this.printTriple(x + 105, y + 11, this.char.temptation, this.char.temptationBase, this.char.temptationBonus);
    this.printVal(x + 105, y + 17, `${this.char.actor.system.virtue}`);
  }

  printSpecials(x: number, y: number): void {
    const xPos = x + 105;
    let yPos = y + 46;
    for (const specialism of this.specialisms) {
      this.printVal(xPos, yPos, `${specialism.name}`);
      yPos += 6;
    }
  }

  async printCombat(x: number, y: number): Promise<void> {
    this.printTriple(
      x + 18,
      y + 46,
      `${this.char.melee}`,
      plusminus(this.char.actor.system.attack.melee.base),
      plusminus(this.char.actor.system.attack.melee.bonus),
    );
    this.printTriple(
      x + 18,
      y + 52,
      `${this.char.ranged}`,
      plusminus(this.char.actor.system.attack.ranged.base),
      plusminus(this.char.actor.system.attack.ranged.bonus),
    );
    await this.printWeapons(x - 32, y + 57);
  }

  printWealth(x: number, y: number): void {
    const thalers = `${this.char.actor.system.wealth.th ?? 0}`;
    const pfennigs = `${this.char.actor.system.wealth.pf ?? 0}`;
    const groetschen = `${this.char.actor.system.wealth.gr ?? 0}`;
    this.printVal(x + 99, y + 130, thalers);
    this.printVal(x + 128, y + 130, pfennigs);
    this.printVal(x + 155, y + 130, groetschen);
  }

  printAttribute(x: number, y: number, value: string, bonus: string): void {
    this.printVal(x, y, value);
    this.printVal(x + 12, y, bonus);
  }

  printTriple(x: number, y: number, value: string, base: string, bonus: string): void {
    this.printVal(x, y, value);
    this.printVal(x + 16, y, base);
    this.printVal(x + 29, y, bonus);
  }

  printVal(x: number, y: number, value: string): void {
    this.doc.text(value, x, y, {
      align: 'center',
      lineHeightFactor: 0.5,
    });
  }

  async printWeapons(x: number, y: number): Promise<void> {
    const fontSize = this.doc.getFontSize();
    this.doc.setFontSize(fontSize - 2);
    let yPos = y;
    let count = 0;
    for (const weapon of this.char.actor.system.possessions.weapons) {
      const skillBonusTags = $.parseHTML(await CONFIG.HV.itemClasses['weapon'].getTags(weapon, this.char.actor));
      const tags = $(skillBonusTags).children();
      const skillBonus: string[] = [];
      $.each(tags, (_i, val) => {
        skillBonus.push(val.innerText);
      });
      this.doc.text(`${weapon.name} (${skillBonus.join(',')})`, x, yPos, { lineHeightFactor: 0.5 });
      count++;
      if (count < 3) {
        yPos += 6;
      } else {
        break;
      }
    }
    this.doc.setFontSize(fontSize);
  }

  async printArmour(x: number, y: number): Promise<void> {
    const fontSize = this.doc.getFontSize();
    this.doc.setFontSize(fontSize - 2);
    let armourList = '(';
    for (const armour of this.char.actor.system.possessions.armour) {
      armourList += ` ${armour.name} `;
    }
    armourList += ')';
    this.doc.text(armourList, x, y, { lineHeightFactor: 0.5 });
    this.doc.setFontSize(fontSize);
  }

  async printSkills(x: number, y: number): Promise<void> {
    const fontSize = this.doc.getFontSize();
    this.doc.setFontSize(fontSize - 2);
    let yPos = y;
    let xPos = x;
    const startY = y;
    let count = 0;
    for (const skill of this.char.actor.itemTypes['skill']) {
      const skillBonusTags = $.parseHTML(await CONFIG.HV.itemClasses['skill'].getTags(skill, this.char.actor));
      const lastTag = $(skillBonusTags).children().last().text();
      const skillBonus = lastTag != '' ? parseInt($(skillBonusTags).children().last().text()) : 0;
      if (skillBonus) {
        this.doc.text(`${skill.name}`, xPos, yPos, { lineHeightFactor: 0.5 });
        this.printTriple(
          xPos + 50,
          yPos,
          plusminus(skillBonus),
          plusminus(this.char.actor.system.level),
          plusminus(skillBonus - this.char.actor.system.level),
        );
        count++;
        if (count % 5 != 0) {
          yPos += 6;
        } else {
          yPos = startY;
          xPos += 87;
        }
      }
    }
    this.doc.setFontSize(fontSize);
  }

  async printPossessions(x: number, y: number) {
    const fontSize = this.doc.getFontSize();
    const worn: HVItem[] = [];
    const carried: HVItem[] = [];
    const mount: HVItem[] = [];
    this.doc.setFontSize(fontSize - 2);
    for (const category of Object.values(this.char.actor.system.possessions)) {
      for (const item of category as HVItem[]) {
        switch ((item as HVItem).getFlag('helveczia', 'position')) {
          case 'worn':
            worn.push(item);
            break;
          case 'carried':
            carried.push(item);
            break;
          default:
            mount.push(item);
            break;
        }
      }
    }
    let xPos = x;
    let yPos = y;
    for (const category of [worn, carried, mount]) {
      for (const item of category) {
        this.doc.text(`${item.name}`, xPos, yPos, { lineHeightFactor: 0.5 });
        yPos += 6;
      }
      xPos += 60;
      yPos = y;
    }
    this.doc.setFontSize(fontSize);
  }

  printDescription(x: number, y: number, text: string, linespace: number, cols = 100): number {
    const desc = $.parseHTML(text)[0];
    const lines = wordwrap($(desc).text(), cols);
    lines.forEach((line) => {
      this.doc.text(line, x, y);
      y += linespace;
    });
    return y;
  }

  async printNotes(x: number, y: number): Promise<void> {
    this.printDescription(x, y, this.char.actor.system.description, 7);
  }

  async printDeeds(x: number, y: number): Promise<void> {
    const fontSize = this.doc.getFontSize();
    this.doc.setFontSize(fontSize - 2);
    let xPos = x;
    let yPos = y;
    for (const category of [this.char.actor.system.sins, this.char.actor.system.virtues]) {
      for (const deed of category) {
        const deedTags = $.parseHTML(await CONFIG.HV.itemClasses['deed'].getTags(deed, this.char.actor));
        const descHTML = $.parseHTML(deed.system.description);
        const tags = $(deedTags).children();
        const deedBonus: string[] = [];
        $.each(tags, (_i, val) => {
          deedBonus.push(val.innerText);
        });
        this.doc.text(`${deed.name} (${deedBonus.join(',')}):`, xPos, yPos);
        yPos += 6;
        const lines = wordwrap($(descHTML).text(), 40);
        lines.forEach((line) => {
          this.doc.text(line, xPos + 5, yPos);
          yPos += 6;
        });
      }
      xPos += 80;
      yPos = y;
    }
    this.doc.setFontSize(fontSize);
  }

  async printSpells(x: number, y: number, page: number, spells: HVItem[]): Promise<void> {
    this.doc.addPage();
    this.doc.addImage({
      imageData: pages[page],
      x: 0,
      y: 0,
      width: 210,
      height: 295,
    });
    const xPos = x;
    let yPos = y;
    let count = 0;
    while (spells.length > 0) {
      const spell = spells.shift();
      if (spell) {
        this.doc.text(`${spell.name}`, xPos, yPos);
        this.doc.text(`${spell.system.level}`, xPos + 90, yPos, { align: 'center' });
        this.doc.text(`${spell.system.range}`, xPos + 112, yPos, { align: 'center' });
        const fontSize = this.doc.getFontSize();
        this.doc.setFontSize(fontSize - 4);
        this.printDescription(xPos + 124, yPos - 2, spell.system.duration, 2, 15);
        this.doc.text(`${spell.system.area}`, xPos + 154, yPos - 2, { align: 'center' });
        this.doc.setFontSize(fontSize - 2);
        this.printDescription(xPos, yPos + 6, spell.system.description, 4, 128);
        this.doc.text(`${spell.system.component}`, xPos + 30, yPos + 28);
        this.doc.setFontSize(fontSize);
        count += 1;
      }
      const slots = 5 + (page - 3) * 2;
      if (count < slots) {
        yPos += 35;
      } else {
        await this.printSpells(25, 34, 4, spells);
        break;
      }
    }
  }

  static getPDFButton() {
    return {
      label: 'HV.dialog.PDF',
      class: 'configure-actor',
      icon: 'fa-solid fa-file-pdf',
      action: 'printPDF',
    };
  }

  static async printSheet(ev): Promise<void> {
    const sheetElement = ev.currentTarget.closest('.sheet').querySelector('.window-content');
    const char: character = {
      actor: this.actor,
      title: sheetElement.querySelector('.actor-class').querySelector('h3').innerText,
      initBonus: sheetElement.querySelector('input#init-bonus').value,
      strBonus: sheetElement.querySelector('input#str-mod').value.replace(/\(/, '').replace(/\)/, ''),
      conBonus: sheetElement.querySelector('input#con-mod').value.replace(/\(/, '').replace(/\)/, ''),
      wisBonus: sheetElement.querySelector('input#wis-mod').value.replace(/\(/, '').replace(/\)/, ''),
      intBonus: sheetElement.querySelector('input#int-mod').value.replace(/\(/, '').replace(/\)/, ''),
      dexBonus: sheetElement.querySelector('input#dex-mod').value.replace(/\(/, '').replace(/\)/, ''),
      chaBonus: sheetElement.querySelector('input#cha-mod').value.replace(/\(/, '').replace(/\)/, ''),
      bravery: sheetElement.querySelector('h3.saves-bravery-value').innerText,
      braveryBase: sheetElement.querySelector('h3#bravery-base').innerText,
      braveryBonus: sheetElement.querySelector('h3#bravery-bonus').innerText,
      deftness: sheetElement.querySelector('h3.saves-deftness-value').innerText,
      deftnessBase: sheetElement.querySelector('h3#deftness-base').innerText,
      deftnessBonus: sheetElement.querySelector('h3#deftness-bonus').innerText,
      temptation: sheetElement.querySelector('h3.saves-temptation-value').innerText,
      temptationBase: sheetElement.querySelector('h3#temptation-base').innerText,
      temptationBonus: sheetElement.querySelector('h3#temptation-bonus').innerText,
      melee: sheetElement.querySelector('h3#melee-mod').innerText,
      ranged: sheetElement.querySelector('h3#ranged-mod').innerText,
      cc: sheetElement.querySelector('h3#cc-mod').innerText,
    };
    const pdf = new HVPDF(char, this);
    await pdf.printOfficial();
    pdf.doc.save(`${char.actor.name}-sheet.pdf`);
  }
}
