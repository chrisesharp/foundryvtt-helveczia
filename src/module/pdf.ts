import { jsPDF } from 'jspdf';

export class HVPDF {
  static getPDFButton(sheet): Application.HeaderButton {
    const button: Application.HeaderButton = {
      label: game.i18n.localize('HV.dialog.PDF'),
      class: 'configure-actor',
      icon: 'fa-solid fa-file-pdf',
      onclick: (ev) => HVPDF.printSheet(ev, sheet),
    };
    return button;
  }

  static async printSheet(event, sheet): Promise<void> {
    const doc = new jsPDF();
    const sheetElement = event.currentTarget.closest('.sheet');
    const elementHTML = $(sheetElement).find('.window-content').html();
    const name = sheet.actor.name;
    // doc.text('Hello World', 10, 10);
    // doc.save(`${name}-character.pdf`);
    doc.html(elementHTML, {
      callback: function (doc) {
        // Save the PDF
        doc.save(`${name}-character.pdf`);
      },
      x: 15,
      y: 15,
      width: 170, //target width in the PDF document
      windowWidth: 650, //window width in CSS pixels
    });
  }
}
