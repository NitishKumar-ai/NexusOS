// packages/connectors/firebase/index.ts
import * as admin from 'firebase-admin';
import type { MCPConnector, ConnectorConfig, ConnectorResult } from '../types';
import { randomUUID } from 'crypto';

export class FirebaseConnector implements MCPConnector {
  name = 'firebase';
  version = '1.0.0';
  private db: admin.firestore.Firestore | null = null;

  async connect(config: ConnectorConfig): Promise<void> {
    if (this.db) return; // already connected

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId:   config.projectId,
          privateKey:  config.privateKey?.replace(/\\n/g, '\n'),
          clientEmail: config.clientEmail,
        }),
      });
    }

    this.db = admin.firestore();
    console.log('[Firebase] Connected to project:', config.projectId);
  }

  async execute(action: string, params: Record<string, unknown>): Promise<ConnectorResult> {
    if (!this.db) throw new Error('[Firebase] Not connected — call connect() first');

    try {
      let data: unknown = null;

      switch (action) {

        case 'firestore.write': {
          // params: { collection, id, data }
          const ref = this.db
            .collection(params.collection as string)
            .doc(params.id as string);
          await ref.set(params.data as Record<string, unknown>, { merge: true });
          data = { written: true, path: ref.path };
          break;
        }

        case 'firestore.read': {
          // params: { collection, id }
          const doc = await this.db
            .collection(params.collection as string)
            .doc(params.id as string)
            .get();
          data = doc.exists ? doc.data() : null;
          break;
        }

        case 'firestore.query': {
          // params: { collection, field, operator, value, limit }
          let query: admin.firestore.Query = this.db.collection(params.collection as string);
          if (params.field && params.operator && params.value !== undefined) {
            query = query.where(
              params.field as string,
              params.operator as admin.firestore.WhereFilterOp,
              params.value
            );
          }
          if (params.limit) query = query.limit(params.limit as number);
          const snap = await query.get();
          data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          break;
        }

        case 'firestore.delete': {
          // params: { collection, id }
          await this.db
            .collection(params.collection as string)
            .doc(params.id as string)
            .delete();
          data = { deleted: true };
          break;
        }

        case 'mission.save': {
          // Convenience: save a NexusOS mission to missions collection
          const mission = params.mission as Record<string, unknown>;
          await this.db.collection('missions').doc(mission.id as string).set(mission, { merge: true });
          data = { saved: true, id: mission.id };
          break;
        }

        case 'mission.get': {
          // Convenience: get a NexusOS mission by ID
          const doc = await this.db.collection('missions').doc(params.id as string).get();
          data = doc.exists ? { id: doc.id, ...doc.data() } : null;
          break;
        }

        case 'mission.list': {
          // Convenience: list recent missions
          const snap = await this.db
            .collection('missions')
            .orderBy('created_at', 'desc')
            .limit((params.limit as number) || 20)
            .get();
          data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          break;
        }

        case 'event.log': {
          // Log a mission event to Firestore for audit trail
          const event = params.event as Record<string, unknown>;
          await this.db.collection('mission_events').add({
            ...event,
            logged_at: admin.firestore.FieldValue.serverTimestamp(),
          });
          data = { logged: true };
          break;
        }

        default:
          return {
            success: false,
            error: `Unknown action: ${action}`,
            action_id: randomUUID(),
            timestamp: new Date().toISOString(),
          };
      }

      return {
        success: true,
        data,
        action_id: randomUUID(),
        timestamp: new Date().toISOString(),
      };

    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown Firebase error',
        action_id: randomUUID(),
        timestamp: new Date().toISOString(),
      };
    }
  }

  async disconnect(): Promise<void> {
    if (admin.apps.length) {
      await admin.app().delete();
      this.db = null;
    }
    console.log('[Firebase] Disconnected');
  }
}
