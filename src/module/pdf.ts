import { jsPDF, jsPDFOptions } from 'jspdf';

export class HVPDF {
  static getPDFButton(sheet): Application.HeaderButton {
    const button: Application.HeaderButton = {
      label: game.i18n.localize('HV.dialog.PDF'),
      class: 'configure-actor',
      icon: 'fa-solid fa-file-pdf',
      onclick: (ev) => {
        ui.notifications.info('Generating PDF now');
        HVPDF.printSheet(ev, sheet);
      },
    };
    return button;
  }

  static async printSheet(ev, sheet): Promise<void> {
    const sheetElement = ev.currentTarget.closest('.sheet').querySelector('.window-content');
    const actor = sheet.actor;
    const title = sheetElement.querySelector('.actor-class').querySelector('h3').innerText;
    const initBonus = sheetElement.querySelector('input#init-bonus').value;
    const strBonus = sheetElement.querySelector('input#str-mod').value;
    const conBonus = sheetElement.querySelector('input#con-mod').value;
    const wisBonus = sheetElement.querySelector('input#wis-mod').value;
    const intBonus = sheetElement.querySelector('input#int-mod').value;
    const dexBonus = sheetElement.querySelector('input#dex-mod').value;
    const chaBonus = sheetElement.querySelector('input#cha-mod').value;
    const bravery = sheetElement.querySelector('h3.saves-bravery-value').innerText;
    const deftness = sheetElement.querySelector('h3.saves-deftness-value').innerText;
    const temptation = sheetElement.querySelector('h3.saves-temptation-value').innerText;
    const melee = sheetElement.querySelector('h3#melee-mod').innerText;
    const ranged = sheetElement.querySelector('h3#ranged-mod').innerText;
    const cc = sheetElement.querySelector('h3#cc-mod').innerText;

    const pdfOpts: jsPDFOptions = {
      orientation: 'portrait',
    };
    const doc = new jsPDF(pdfOpts);
    doc.addImage({
      imageData: '/systems/helveczia/assets/empty_frame.png',
      x: 0,
      y: 0,
      width: 210,
      height: 295,
    });
    doc.text(`${actor.name}, ${title}`, 105, 35, { align: 'center', lineHeightFactor: 2 });
    doc.addImage({
      imageData: sheet.actor.img,
      x: 30,
      y: 40,
      width: 40,
      height: 40,
    });
    doc.text(
      `AC: ${actor.system.ac}, Initiative: ${initBonus}, Virtue: ${actor.system.virtue}, HP: ${actor.system.hp.value}`,
      80,
      50,
      { lineHeightFactor: 0.7 },
    );
    doc.text(`STR: ${actor.system.scores.str.value} ${strBonus},`, 80, 65, { lineHeightFactor: 0.7 });
    doc.text(`CON: ${actor.system.scores.con.value} ${conBonus},`, 115, 65, { lineHeightFactor: 0.7 });
    doc.text(`WIS: ${actor.system.scores.wis.value} ${wisBonus}`, 150, 65, { lineHeightFactor: 0.7 });
    doc.text(`DEX: ${actor.system.scores.dex.value} ${dexBonus},`, 80, 75, { lineHeightFactor: 0.7 });
    doc.text(`INT: ${actor.system.scores.int.value} ${intBonus},`, 115, 75, { lineHeightFactor: 0.7 });
    doc.text(`CHA: ${actor.system.scores.cha.value} ${chaBonus}`, 150, 75, { lineHeightFactor: 0.7 });
    doc.text(`Bravery: ${bravery}, Deftness: ${deftness}, Temptation: ${temptation}`, 105, 90, {
      align: 'center',
      lineHeightFactor: 1,
    });
    doc.text(`Mêlée: ${melee}, Ranged: ${ranged}, CC: ${cc}`, 105, 100, {
      align: 'center',
      lineHeightFactor: 1,
    });
    doc.save(`${actor.name}-sheet.pdf`);
  }
}
