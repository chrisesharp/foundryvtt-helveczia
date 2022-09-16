import { HVActor } from '../actor/actor';
import { HVItem } from '../items/item';

type EmbeddedSubject = HVItem | HVActor;

export enum EmbeddedObject {
  Item = 'Item',
  ActiveEffect = 'ActiveEffect',
}

type EmbeddedObjectType = HVItem | ActiveEffect;

export class Utils {
  static async deleteEmbeddedArray(arr: EmbeddedObjectType[], subject: EmbeddedSubject) {
    const docType = arr[0] instanceof Item ? 'Item' : 'ActiveEffect';
    return subject.deleteEmbeddedDocuments(
      docType,
      arr.reduce((acc: string[], p) => {
        if (p.id) acc.push(p.id);
        return acc;
      }, []),
    );
  }
}
