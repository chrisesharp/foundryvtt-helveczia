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
        {
          name: 'Aurel Vajthy',
          title: '2nd Level Hungarian Hussar',
          init: '0',
          virtue: 7,
          balance: '-left',
          ac: 15,
          tabs: ['fighter'],
          saves: ['+4', '+1', '+2'],
          combat: ['+7', '+3', '+3'],
          skills: '5 / 5',
          pc: true,
        },
        // Gerhard gets +1 to saves for high virtue
        // eslint-disable-next-line prettier/prettier
        {
          name: 'Gerhardt Maier',
          title: '2nd Level German Cleric',
          init: '+2',
          virtue: 12,
          balance: '-right',
          ac: 14,
          tabs: ['cleric'],
          saves: ['+3', '+3', '+5'],
          combat: ['0', '+3', '+1'],
          skills: '8 / 8',
          pc: true,
        },
        // eslint-disable-next-line prettier/prettier
        {
          name: 'Isolde Knecht',
          title: '2nd Level German Student',
          init: '0',
          virtue: 11,
          balance: '',
          ac: 14,
          tabs: ['student'],
          saves: ['+2', '+1', '+4'],
          combat: ['+3', '+1', '+1'],
          skills: '9 / 9',
          pc: true,
        },
        // eslint-disable-next-line prettier/prettier
        {
          name: 'Jan Olbrecht',
          title: '2nd Level Czech Vagabond',
          init: '+1',
          virtue: 8,
          balance: '',
          ac: 15,
          tabs: ['vagabond'],
          saves: ['+3', '+4', '+2'],
          combat: ['+2', '+4', '+1'],
          skills: '8 / 8',
          pc: true,
        },
        // eslint-disable-next-line prettier/prettier
        {
          name: 'Krampus',
          title: '3+2*',
          init: '+2',
          virtue: 2,
          ac: 13,
          tabs: [],
          saves: ['+5', '+3', '+3'],
          combat: ['+6', '+6', '+6'],
          skills: '',
        },
      ];

      before(() => {});

      beforeEach(() => {});

      afterEach(() => {});

      after(() => {});

      characters.forEach(({ name, title, init, virtue, balance, ac, tabs, saves, combat, skills, pc }) => {
        describe(`render ${name}'s actor sheet correctly`, () => {
          let sheet: any;
          let root: HTMLElement;
          let classPeopleLevel: string;
          let actor: Actor | undefined;
          before(async () => {
            actor = game.actors?.getName(name);
            sheet = actor?.sheet;
            await sheet?.render(true);
            root = sheet?.element;
            classPeopleLevel = pc
              ? (root?.querySelector('div.actor-class')?.textContent ?? '').replace(/\s+/g, ' ').trim()
              : root?.querySelector<HTMLInputElement>('input[name="system.levelBonus"]')?.value ?? '';
          });

          it('has correct title', () => {
            expect(sheet).to.not.be.undefined;
            expect(classPeopleLevel).to.have.string(title);
          });

          it('has correct initiative', () => {
            expect(root?.querySelector<HTMLInputElement>('input[name="system.initiative"]')?.value).to.equal(init);
          });

          it('has correct AC', () => {
            expect(root?.querySelector<HTMLInputElement>('input[name="system.ac"]')?.value).to.equal(`${ac}`);
          });

          it('has correct saves', () => {
            expect(root?.querySelector('.saves-bravery-value')?.textContent?.trim()).to.equal(saves[0]);
            expect(root?.querySelector('.saves-deftness-value')?.textContent?.trim()).to.equal(saves[1]);
            expect(root?.querySelector('.saves-temptation-value')?.textContent?.trim()).to.equal(saves[2]);
          });

          it('has correct number of skills', () => {
            const skillHdr = root?.querySelector('.skills h2')?.textContent ?? '';
            expect(skillHdr).to.have.string(skills);
          });

          it('has correct combat mods', () => {
            expect(root?.querySelector('#melee-mod')?.textContent?.trim()).to.equal(combat[0]);
            expect(root?.querySelector('#ranged-mod')?.textContent?.trim()).to.equal(combat[1]);
            expect(root?.querySelector('#cc-mod')?.textContent?.trim()).to.equal(combat[2]);
          });

          it('has correct tabs', () => {
            const pcTabs = ['abilities', 'combat', 'skills', 'possessions', 'notes'];
            if (pc) pcTabs.push('deeds');
            pcTabs.forEach((tab) => {
              const thisTab = root?.querySelectorAll(`[data-tab="${tab}"]`);
              expect(thisTab?.length).to.equal(2); // tab sheet and navigation entry
            });
            tabs.forEach((tab) => {
              const thisTab = root?.querySelectorAll(`[data-tab="${tab}"]`);
              expect(thisTab?.length).to.equal(2); // tab sheet and navigation entry
            });
          });

          it('has correct virtue', () => {
            expect(root?.querySelector<HTMLInputElement>('input[name="system.virtue"]')?.value).to.equal(`${virtue}`);
            if (pc) {
              const reds = root?.querySelectorAll('.full-mark-red').length ?? 0;
              const blues = root?.querySelectorAll('.full-mark-blue').length ?? 0;
              const greens = root?.querySelectorAll('.full-mark-green').length ?? 0;
              const empties = root?.querySelectorAll('.empty-mark').length ?? 0;
              expect(reds + blues + greens).to.equal(virtue);
              expect(empties).to.equal(21 - virtue);
              if (virtue < 8) {
                const leftBalance = root?.querySelectorAll(`.virtue-balance .fa-balance-scale${balance}:first-child`);
                expect(leftBalance?.length).to.equal(1);
              }
              const origVirtueInput = root?.querySelector<HTMLInputElement>('input[name="system.origVirtue"]');
              const origVirtue = Number.parseInt(origVirtueInput?.value ?? '0');
              const sins = actor?.system.deeds
                .filter((d) => d.system.subtype === 'sin')
                .map((d) => Number.parseInt(d.system.magnitude))
                .reduce((partialSum, a) => partialSum + a, 0);
              const virtues = actor?.system.deeds
                .filter((d) => d.system.subtype === 'virtue')
                .map((d) => Number.parseInt(d.system.magnitude))
                .reduce((partialSum, a) => partialSum + a, 0);
              expect(origVirtue + virtues - sins).to.equal(virtue);
            }
          });

          after(async () => {
            await sheet?.close();
          });
        });
      });
    },
    { displayName: 'QUENCH: Snapshot Test' },
  );
}
