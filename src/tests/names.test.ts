import { HVNameGenerator } from '../module/apps/names';

export function nameTests(context) {
  const { describe, it, beforeEach, before, afterEach, after, expect } = context;

  describe('Generate names', function () {
    this.timeout(60000);

    before(() => {});

    beforeEach(() => {});

    afterEach(() => {});

    after(() => {});

    [
      { sex: 'female', people: 'italian', needle: '<h1 class="generated-name">' },
      { sex: 'male', people: 'german', needle: '<h1 class="generated-name">' },
    ].forEach(({ sex, people, needle }) => {
      describe(`Render ${sex} ${people} name`, async () => {
        it(`render ${people} ${sex} name to Chat`, async () => {
          // Hook to capture when our dialog has actually rendered
          const rendered = $.Deferred();
          Hooks.once('renderApplication', (...args) => rendered.resolve(args));

          const dialog = await HVNameGenerator.showDialog();

          const [application, $firstHtml] = await rendered.promise();

          // Sanity check the renderApplication hook returned our dialog
          expect(dialog).to.equal(application);

          // Hook to capture when new name generator dialog has been rendered
          const created = $.Deferred();
          Hooks.once('renderApplication', (...args) => created.resolve(args));

          // Dialog API does not expose methods for selection, using dom instead
          $firstHtml.find('select#sex').val(sex);
          $firstHtml.find('select#people').val(people);
          $firstHtml.find('button.dialog-button.ok').click();

          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const [_, $secondHtml] = await created.promise();
          const generatedName = $secondHtml.find('h1.generated-name').text();
          await $secondHtml.find('button.dialog-button.ok').click();
          expect(generatedName.length).to.be.above(0);

          // Hook to capture when new Chat Message has been rendered
          const messageCreated = $.Deferred();
          Hooks.once('renderChatMessageHTML', (...args) => messageCreated.resolve(args));
          const [message] = await messageCreated.promise();
          expect(message.content).to.have.string(needle);
          expect(message.content).to.have.string(generatedName);
          message.delete();
        });
      });
    });
  });
}
