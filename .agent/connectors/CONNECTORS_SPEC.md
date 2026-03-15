# 🔗 NexusOS — MCP Connectors Spec

Source: packages/connectors/
Build order: Firebase → GitHub → Linear → Figma

---

## Standard Interface (all connectors implement this)

```typescript
// packages/connectors/types.ts

export interface MCPConnector {
  name: string;
  version: string;
  connect(config: ConnectorConfig): Promise<void>;
  execute(action: string, params: Record<string, unknown>): Promise<ConnectorResult>;
  disconnect(): Promise<void>;
}

export interface ConnectorConfig {
  apiKey?: string;
  projectId?: string;
  baseUrl?: string;
  [key: string]: string | undefined;
}

export interface ConnectorResult {
  success: boolean;
  data?: unknown;
  error?: string;
  action_id: string;
  timestamp: string;
}
```

---

## Connector 1 — Firebase (Build First)

**Why first:** Easiest API, needed for NexusOS state persistence and credential storage.

### Actions to implement

| Action | Method | What it does |
|---|---|---|
| firestore.read | GET document | Read agent state, session trace |
| firestore.write | SET document | Write mission result, agent state |
| firestore.query | QUERY collection | List missions, filter by status |
| firestore.delete | DELETE document | Clean up expired sessions |
| auth.listUsers | Admin SDK | List registered developers (admin only) |

### Config (environment variables)

```env
FIREBASE_PROJECT_ID=nexusos-prod
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...
```

### Basic implementation sketch

```typescript
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export class FirebaseConnector implements MCPConnector {
  name = 'firebase';
  version = '1.0.0';
  private db: Firestore;

  async connect(config: ConnectorConfig) {
    initializeApp({ credential: cert({...}) });
    this.db = getFirestore();
  }

  async execute(action: string, params) {
    switch(action) {
      case 'firestore.write':
        await this.db.collection(params.collection).doc(params.id).set(params.data);
        return { success: true, action_id: randomUUID(), timestamp: new Date().toISOString() };
      // ... other actions
    }
  }
}
```

---

## Connector 2 — GitHub (Build Second)

**Why second:** Needed for P1 Context Pull Git operations and mission result delivery.

### Actions to implement

| Action | What it does |
|---|---|
| repo.getInfo | Get repo metadata |
| issue.create | Create issue from mission result |
| issue.list | List open issues |
| pr.getSummary | Get PR description + status |
| pr.create | Create PR for agent changes |
| file.read | Read file content from repo |
| file.write | Push file change via API |

### Config

```env
GITHUB_TOKEN=ghp_...
GITHUB_ORG=Inmodel-Labs
```

---

## Connector 3 — Linear (Build Third)

**Why third:** Mission result delivery — create tickets from agent findings.

### Actions to implement

| Action | What it does |
|---|---|
| issue.create | Create ticket from mission result |
| issue.update | Update ticket status |
| issue.list | List project tickets |
| project.status | Get project board status |
| comment.add | Add comment to ticket |

### Config

```env
LINEAR_API_KEY=lin_api_...
LINEAR_TEAM_ID=...
```

---

## Connector 4 — Figma (Build Last — most complex)

**Why last:** Requires understanding of Figma's node tree structure.

### Actions to implement

| Action | What it does |
|---|---|
| comment.add | Add comment to specific node |
| file.getStructure | Read file component tree |
| frame.export | Export frame as PNG/SVG |
| component.list | List all components in file |

### Config

```env
FIGMA_TOKEN=figd_...
FIGMA_FILE_ID=...
```

---

## Connector Registry (packages/connectors/index.ts)

```typescript
import { FirebaseConnector } from './firebase';
import { GitHubConnector } from './github';
import { LinearConnector } from './linear';
import { FigmaConnector } from './figma';
import type { MCPConnector } from './types';

const connectors: Record<string, MCPConnector> = {
  firebase: new FirebaseConnector(),
  github:   new GitHubConnector(),
  linear:   new LinearConnector(),
  figma:    new FigmaConnector(),
};

export function getConnector(name: string): MCPConnector {
  const connector = connectors[name];
  if (!connector) throw new Error(`Unknown connector: ${name}`);
  return connector;
}

export function listConnectors(): string[] {
  return Object.keys(connectors);
}
```

---

## How Traffic Controller Calls Connectors

The Rust Traffic Controller communicates with connectors via HTTP (SDK Bridge acts as the bridge):

```
Traffic Controller (Rust)
    → POST http://localhost:3002/connector/{name}/{action}
    → SDK Bridge (Node.js) receives request
    → Calls getConnector(name).execute(action, params)
    → Returns ConnectorResult as JSON
    → Rust receives result
```

This keeps Rust doing what it does best (fast routing) and delegates all external API calls to Node.js where the SDKs live.
