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

  static async getActorFromUUID(uuid): Promise<HVActor> {
    const obj = await fromUuid(uuid);

    if (obj instanceof TokenDocument) {
      return obj.actor as HVActor;
    }
    return obj as HVActor;
  }

  static canModifyActor(user: StoredDocument<User> | null, actor: HVActor | null): boolean {
    return (
      user != null &&
      actor != null &&
      user.isGM &&
      actor?.testUserPermission(user, CONST.DOCUMENT_PERMISSION_LEVELS.OWNER)
    );
  }
}
