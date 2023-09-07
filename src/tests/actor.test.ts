export function actorTests(context) {
  const { describe, it, beforeEach, before, afterEach, after, expect } = context;

  type Character = {
    name: string;
    title: string;
    init: string;
    virtue: number;
    balance?: string;
    ac: number;
    saves: string[];
    combat: string[];
    tabs: string[];
    skills: string;
    pc?: boolean;
  };

  describe(
    'Render Actors',
    function () {
      this.timeout(10000);

      const characters: Character[] = [
        // Aurel gets +2 AC for being Hungarian
        // eslint-disable-next-line prettier/prettier
        { name: 'Aurel Vajthy', title: '2nd level Hungarian Hussar', init:'0', virtue: 6, balance: '-left', ac: 15, tabs: ['fighter'], saves: ['+4', '+1', '+2'], combat: ['+7', '+3', '+3'], skills: '5 / 5', pc: true },
        // Gerhard gets +1 to saves for high virtue
        // eslint-disable-next-line prettier/prettier
        { name: 'Gerhardt Maier', title: '2nd level German Cleric', init:'+2',virtue: 15, balance: '-right', ac: 14, tabs: ['cleric'], saves: ['+4', '+4', '+6'], combat: ['0', '+3', '+1'], skills: '8 / 8', pc: true },
        // eslint-disable-next-line prettier/prettier
        { name: 'Isolde Knecht', title: '4th level German Student', init:'0',virtue: 12, balance: '', ac: 12, tabs: ['student'], saves: ['+3', '+2', '+5'], combat: ['+4', '+2', '+2'], skills: '10 / 10', pc: true },
        // eslint-disable-next-line prettier/prettier
        { name: 'Jan Olbrecht', title: '2nd level Czech Vagabond', init:'+1', virtue: 7, balance: '-left', ac: 13, tabs: ['vagabond'], saves: ['+3', '+4', '+2'], combat: ['+3', '+3', '+2'], skills: '7 / 7', pc: true },
        // eslint-disable-next-line prettier/prettier
        { name: 'Krampus', title: '3+2*', init:'+2', virtue: 2, ac: 13, tabs: [], saves: ['+5', '+3', '+3'], combat: ['+6', '+6', '+6'], skills: ''}
      ];

      before(() => {});

      beforeEach(() => {});

      afterEach(() => {});

      after(() => {});

      characters.forEach(({ name, title, init, virtue, balance, ac, tabs, saves, combat, skills, pc }) => {
        describe(`render ${name}'s actor sheet correctly`, async () => {
          let sheet: any;
          let $html: any;
          let classPeopleLevel: string;
          let actor: Actor | undefined;
          before(async () => {
            // Hook to capture when our actor sheet has actually rendered
            const rendered = $.Deferred();
            Hooks.once('renderActorSheet', (...args) => rendered.resolve(args));

            actor = game.actors?.getName(name);
            await actor?.sheet?.render(true);

            [sheet, $html] = await rendered.promise();
            classPeopleLevel = pc
              ? $html.find('div.actor-class').text().replace(/\s+/g, ' ').trim()
              : $html.find('input[name="data.levelBonus"]').val();
          });

          it('has correct title', () => {
            expect(sheet).to.not.be.undefined;
            expect(classPeopleLevel).to.have.string(title);
          });

          it('has correct initiative', () => {
            expect($html.find('input[name="data.initiative"]').val()).to.equal(init);
          });

          it('has correct AC', () => {
            expect($html.find('input[name="data.ac"]').val()).to.equal(`${ac}`);
          });

          it('has correct saves', () => {
            expect($html.find('.saves-bravery-value').text()).to.equal(saves[0]);
            expect($html.find('.saves-deftness-value').text()).to.equal(saves[1]);
            expect($html.find('.saves-temptation-value').text()).to.equal(saves[2]);
          });

          it('has correct number of skills', () => {
            const skillHdr = $html.find('div.skills').find('h2').text();
            expect(skillHdr).to.have.string(skills);
          });

          it('has correct combat mods', () => {
            expect($html.find('#melee-mod').text()).to.equal(combat[0]);
            expect($html.find('#ranged-mod').text()).to.equal(combat[1]);
            expect($html.find('#cc-mod').text()).to.equal(combat[2]);
          });

          it('has correct tabs', () => {
            const pcTabs = ['abilities', 'combat', 'skills', 'possessions', 'editor'];
            if (pc) pcTabs.push('deeds');
            pcTabs.forEach((tab) => {
              const thisTab = $html.find(`[data-tab="${tab}"]`);
              expect(thisTab.length).to.equal(2); // tab sheet and navigation entry
            });
            tabs.forEach((tab) => {
              const thisTab = $html.find(`[data-tab="${tab}"]`);
              expect(thisTab.length).to.equal(2); // tab sheet and navigation entry
            });
          });

          it('has correct virtue', () => {
            expect($html.find('input[name="data.virtue"]').val()).to.equal(`${virtue}`);
            if (pc) {
              const reds = $html.find('.full-mark-red').length;
              const blues = $html.find('.full-mark-blue').length;
              const greens = $html.find('.full-mark-green').length;
              const empties = $html.find('.empty-mark').length;
              expect(reds + blues + greens).to.equal(virtue);
              expect(empties).to.equal(21 - virtue);
              const leftBalance = $html.find('.virtue-balance').find(`.fa-balance-scale${balance}:first-child`);
              expect(leftBalance.length).to.equal(1);
              const origVirtue = parseInt($html.find('input[name="data.origVirtue"]').val());
              const sins = actor?.system.deeds
                .filter((d) => d.system.subtype === 'sin')
                .map((d) => parseInt(d.system.magnitude))
                .reduce((partialSum, a) => partialSum + a, 0);
              const virtues = actor?.system.deeds
                .filter((d) => d.system.subtype === 'virtue')
                .map((d) => parseInt(d.system.magnitude))
                .reduce((partialSum, a) => partialSum + a, 0);
              expect(origVirtue + virtues - sins).to.equal(virtue);
            }
          });
          // expect({ foo: 'bar' }).to.matchSnapshot();
          after(async () => {
            await sheet?.close();
          });
        });
      });
    },
    { displayName: 'QUENCH: Snapshot Test', snapBaseDir: '__snapshots__/quench-with-a-twist' },
  );
}
