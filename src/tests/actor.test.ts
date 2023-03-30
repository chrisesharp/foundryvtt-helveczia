export function actorTests(context) {
  const { describe, it, beforeEach, before, afterEach, after, expect } = context;

  describe(
    'Render Actors',
    function () {
      this.timeout(10000);

      before(() => {});

      beforeEach(() => {});

      afterEach(() => {});

      after(() => {});

      // eslint-disable-next-line prettier/prettier
    [
      { name: 'Aurel Vajthy', needle: '<h1 class="generated-name">' }
    ].forEach(({ name, needle }) => {
        it(`render ${name}'s actor sheet correctly`, async () => {
          // Hook to capture when our actor sheet has actually rendered
          const rendered = $.Deferred();
          Hooks.once('renderActorSheet', (...args) => rendered.resolve(args));

          await game.actors?.getName(name)?.sheet?.render(true);
          const [sheet, $html] = await rendered.promise();

          // Dialog API does not expose methods for selection, using dom instead
          // $html.find('select#sex').val(sex);
          // $html.find('button.dialog-button.ok').click();
          expect(sheet).to.not.be.undefined;
          // expect({ foo: 'bar' }).to.matchSnapshot();
          await sheet?.close();
        });
      });
    },
    { displayName: 'QUENCH: Snapshot Test', snapBaseDir: '__snapshots__/quench-with-a-twist' },
  );
}
