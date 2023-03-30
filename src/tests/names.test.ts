import { HVNameGenerator } from '../module/apps/names';

export function nameTests(context) {
  const { describe, it, beforeEach, afterAll, expect } = context;

  describe('Generate names', function () {
    this.timeout(60000);

    beforeEach(() => {});

    afterAll(() => {});

    [
      { sex: 'female', people: 'italian', needle: '<h1 class="generated-name">' },
      { sex: 'male', people: 'german', needle: '<h1 class="generated-name">' },
    ].forEach(({ sex, people, needle }) => {
      it(`render ${people} ${sex} name to Chat`, async () => {
        // Hook to capture when our dialog has actually rendered
        const rendered = $.Deferred();
        Hooks.once('renderApplication', (...args) => rendered.resolve(args));

        const dialog = await HVNameGenerator.showDialog();

        const [application, $firstHtml] = await rendered.promise();

        // Sanity check the renderApplication hook returned our dialog
        expect(dialog).to.equal(application);

        // Hook to capture when new Journal has been rendered
        const created = $.Deferred();
        Hooks.once('renderApplication', (...args) => created.resolve(args));

        // Dialog API does not expose methods for selection, using dom instead
        $firstHtml.find('select#sex').val(sex);
        $firstHtml.find('select#people').val(people);
        $firstHtml.find('button.dialog-button.ok').click();

        const [_, $secondHtml] = await created.promise();
        const generatedName = $secondHtml.find('h1.generated-name').text();
        await $secondHtml.find('button.dialog-button.ok').click();
        expect(generatedName.length).to.be.above(0);

        // Hook to capture when new Journal has been rendered
        const messageCreated = $.Deferred();
        Hooks.once('renderChatMessage', (...args) => messageCreated.resolve(args));
        const [message] = await messageCreated.promise();
        expect(message.content).to.have.string(needle);
        expect(message.content).to.have.string(generatedName);
        message.delete();
      });
    });
  });
}