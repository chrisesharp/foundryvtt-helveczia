import { HVNameGenerator } from '../module/applications/names';

export function nameTests(context) {
  const { describe, it, beforeEach, before, afterEach, after, expect } = context;

  describe('Generate names', function () {
    this.timeout(60000);

    before(() => {});

    beforeEach(() => {});

    afterEach(() => {});

    after(() => {});

    [
      { sex: 'female', people: 'italian', needle: 'generated-name' },
      { sex: 'male', people: 'german', needle: 'generated-name' },
    ].forEach(({ sex, people, needle }) => {
      describe(`Render ${sex} ${people} name`, () => {
        it(`render ${people} ${sex} name to Chat`, async () => {
          const dialog = await HVNameGenerator.showDialog();
          expect(dialog).to.be.an.instanceOf(HVNameGenerator);

          const firstHtml = dialog.element;
          expect(firstHtml).to.not.be.null;

          // Dialog API does not expose methods for selection, using dom instead
          const sexSelect = firstHtml.querySelector<HTMLSelectElement>('select#sex');
          if (sexSelect) sexSelect.value = sex;
          const peopleSelect = firstHtml.querySelector<HTMLSelectElement>('select#people');
          if (peopleSelect) peopleSelect.value = people;

          await HVNameGenerator.randomName.call(dialog, null, null);

          const secondHtml = dialog.element;
          const generatedName =
            secondHtml.querySelector('h1.generated-name, h2#generated-name, .generated-name')?.textContent?.trim() ??
            '';
          expect(generatedName.length).to.be.above(0);

          const message = (await HVNameGenerator.shareName.call(dialog, null, null)) as any;
          expect(message).to.not.be.undefined;
          expect(message.content).to.have.string(needle);
          expect(message.content).to.have.string(generatedName);

          await message.delete();
          await dialog.close();
        });
      });
    });
  });
}
