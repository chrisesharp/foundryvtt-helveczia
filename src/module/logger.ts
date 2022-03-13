/* eslint-disable @typescript-eslint/no-explicit-any */

export class Logger {
  private service: string;

  constructor() {
    this.service = 'helveczia';
  }

  debugMode() {
    return game.settings.get(this.service, 'debug') || false;
  }

  info(message: string) {
    console.log(`${this.service} | INFO | ${message}`);
  }

  debug(message: string, ...objects: any[]) {
    if (this.debugMode()) {
      console.log(`${this.service} | DEBUG | ${message}`);
      objects.forEach((o) => {
        console.log(o);
      });
    }
  }

  error(message: string, ...objects: any[]) {
    console.log(`${this.service} | ERROR| ${message}`);
    objects.forEach((o) => {
      console.log(`${this.service} | ERROR |`, o);
    });
  }
}
