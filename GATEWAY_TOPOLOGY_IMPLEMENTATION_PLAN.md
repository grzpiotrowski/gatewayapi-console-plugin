# Gateway API Topology Plugin - Implementation Plan

**Date**: 2026-04-14  
**Plugin Name**: `gatewayapi-console-plugin`  
**Purpose**: Visualize Gateway API resources in a topology graph similar to OpenShift Console's Topology View

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Decision](#architecture-decision)
3. [Resource Model](#resource-model)
4. [Technology Stack](#technology-stack)
5. [Console Extension Points](#console-extension-points)
6. [Component Architecture](#component-architecture)
7. [Data Transformation Pipeline](#data-transformation-pipeline)
8. [Visual Design](#visual-design)
9. [File Structure](#file-structure)
10. [Implementation Phases](#implementation-phases)
11. [Testing Strategy](#testing-strategy)
12. [References](#references)

---

## Overview

### Goal
Create a dynamic console plugin that visualizes Gateway API resources (GatewayClass, Gateway, HTTPRoute, Service) in a topology graph view, showing network relationships with arrows indicating traffic flow.

### Key Features
- **Resource Visualization**: Display GatewayClass, Gateway, HTTPRoute, Listener, and Service resources as graph nodes
- **Relationship Mapping**: Show connections via directional edges (arrows)
- **Status Indicators**: Display resource health based on Gateway API conditions
- **Interactive UI**: Support selection, pan/zoom, and sidebar details
- **Consistent Styling**: Match OpenShift Console Topology View aesthetics

### Success Criteria
- Users can visualize Gateway API resource topology in a single view
- Clear visual indication of traffic flow from GatewayClass → Gateway → HTTPRoute → Service
- Ability to select resources and view details in sidebar
- Proper status indication for each resource type
- Responsive layout with proper PatternFly 6 styling

---

## Architecture Decision

### Approach: Standalone Plugin Page

**Decision**: Build a standalone topology page rather than extending the existing Topology View.

**Rationale**:
1. **Independent Evolution**: Gateway API topology has different requirements than workload topology
2. **Simpler Implementation**: Avoids complexity of integrating with existing topology filters and contexts
3. **Focused UX**: Dedicated view optimized for Gateway API resources
4. **Easier Maintenance**: Clear separation of concerns

**Future Consideration**: If integration with main Topology view becomes necessary, we can refactor using `console.topology/data/factory` extension.

---

## Resource Model

### Gateway API Resources

```typescript
// Gateway API v1
const GATEWAY_API_VERSION = 'gateway.networking.k8s.io/v1';

// Resource Types
interface GatewayAPIResources {
  GatewayClass: {
    apiVersion: 'gateway.networking.k8s.io/v1';
    kind: 'GatewayClass';
    // cluster-scoped
  };
  Gateway: {
    apiVersion: 'gateway.networking.k8s.io/v1';
    kind: 'Gateway';
    // namespace-scoped
  };
  HTTPRoute: {
    apiVersion: 'gateway.networking.k8s.io/v1';
    kind: 'HTTPRoute';
    // namespace-scoped
  };
  Service: {
    apiVersion: 'v1';
    kind: 'Service';
    // namespace-scoped
  };
}
```

### Node Types

```typescript
// Node type constants
export const TYPE_GATEWAY_CLASS = 'gateway-class';
export const TYPE_GATEWAY = 'gateway';
export const TYPE_HTTP_ROUTE = 'http-route';
export const TYPE_LISTENER = 'listener'; // Derived from Gateway spec.listeners
export const TYPE_SERVICE = 'service';
```

### Edge Types

```typescript
// Edge type constants
export const TYPE_GATEWAY_TO_CLASS = 'gateway-to-class';
export const TYPE_LISTENER_TO_GATEWAY = 'listener-to-gateway';
export const TYPE_ROUTE_TO_LISTENER = 'route-to-listener';
export const TYPE_ROUTE_TO_SERVICE = 'route-to-service';
```

### Topology Model Structure

Based on PatternFly React Topology:

```typescript
import { NodeModel, EdgeModel, Model } from '@patternfly/react-topology';

interface GatewayTopologyModel extends Model {
  nodes: GatewayNodeModel[];
  edges: GatewayEdgeModel[];
}

interface GatewayNodeModel extends NodeModel {
  id: string;              // e.g., "gateway:my-namespace/my-gateway"
  type: string;            // One of the TYPE_* constants
  label: string;           // Display name
  width?: number;          // Node dimensions
  height?: number;
  data: {
    resource: K8sResourceCommon;  // The actual K8s resource
    resourceKind: string;         // e.g., "Gateway"
    status?: NodeStatus;          // success, warning, danger
    // Gateway-specific data
    listeners?: Listener[];       // For Gateway nodes
    rules?: HTTPRouteRule[];      // For HTTPRoute nodes
  };
}

interface GatewayEdgeModel extends EdgeModel {
  id: string;
  type: string;
  source: string;          // Source node ID
  target: string;          // Target node ID
  edgeStyle?: EdgeStyle;
}
```

---

## Technology Stack

### Core Dependencies

```json
{
  "dependencies": {
    "@openshift-console/dynamic-plugin-sdk": "^4.22.0",
    "@patternfly/react-topology": "^6.x",
    "@patternfly/react-core": "^6.x",
    "@patternfly/react-icons": "^6.x",
    "react": "^17.x",
    "react-i18next": "^11.x"
  },
  "devDependencies": {
    "typescript": "^4.x",
    "webpack": "^5.x"
  }
}
```

### PatternFly Topology

**Version**: PatternFly 6.x (Console 4.22+)

**Key Components**:
- `Visualization` - Controller for the topology graph
- `VisualizationSurface` - Rendering surface
- `DefaultNode` - Base node component
- `DefaultEdge` - Base edge component
- `DefaultGroup` - Grouping component (future)
- `GraphComponent` - Graph container
- `ComponentFactory` - Maps types to React components
- `LayoutFactory` - Provides layout algorithms

**Layouts Available**:
- `ColaLayout` - Force-directed layout
- `DagreLayout` - Hierarchical layout (recommended for Gateway API)
- `GridLayout` - Grid-based layout

---

## Console Extension Points

### Primary Extensions

#### 1. Navigation Route (`console.page/route`)

Adds a route to access the Gateway API Topology page.

```json
{
  "type": "console.page/route",
  "properties": {
    "path": [
      "/gateway-topology",
      "/gateway-topology/ns/:ns"
    ],
    "component": {
      "$codeRef": "GatewayTopologyPage"
    }
  }
}
```

#### 2. Navigation Link (`console.navigation/href`)

Adds a navigation item in the admin perspective.

```json
{
  "type": "console.navigation/href",
  "properties": {
    "id": "gateway-topology",
    "name": "%plugin__gatewayapi-console-plugin~Gateway API Topology%",
    "href": "/gateway-topology",
    "perspective": "admin",
    "section": "networking",
    "insertAfter": "routes"
  }
}
```

#### 3. Model Metadata (`console.model-metadata`)

Registers Gateway API resource models for proper resource handling.

```json
{
  "type": "console.model-metadata",
  "properties": {
    "model": {
      "group": "gateway.networking.k8s.io",
      "version": "v1",
      "kind": "GatewayClass"
    },
    "label": "%plugin__gatewayapi-console-plugin~GatewayClass%",
    "labelPlural": "%plugin__gatewayapi-console-plugin~GatewayClasses%",
    "abbr": "GC",
    "color": "#8461C9"
  }
}
```

### Optional Extensions (Future)

#### Resource Actions

```json
{
  "type": "console.action/resource-provider",
  "properties": {
    "model": {
      "group": "gateway.networking.k8s.io",
      "version": "v1",
      "kind": "Gateway"
    },
    "provider": {
      "$codeRef": "gatewayActions"
    }
  }
}
```

#### Resource Details Tab

```json
{
  "type": "console.tab/horizontalNav",
  "properties": {
    "model": {
      "group": "gateway.networking.k8s.io",
      "version": "v1",
      "kind": "Gateway"
    },
    "page": {
      "name": "%plugin__gatewayapi-console-plugin~Topology%",
      "href": "topology"
    },
    "component": {
      "$codeRef": "GatewayTopologyTab"
    }
  }
}
```

---

## Component Architecture

### Component Hierarchy

```
GatewayTopologyPage
├── NamespaceBar (from SDK)
├── GatewayTopologyToolbar
│   ├── NamespaceDropdown
│   ├── LayoutSelector (Dagre/Cola)
│   ├── ZoomControls
│   └── FitToScreen
├── GatewayTopologyContent
│   ├── GatewayTopologyView
│   │   ├── Visualization (PatternFly)
│   │   │   ├── GraphComponent
│   │   │   ├── Nodes (via ComponentFactory)
│   │   │   │   ├── GatewayClassNode
│   │   │   │   ├── GatewayNode
│   │   │   │   ├── ListenerNode
│   │   │   │   ├── HTTPRouteNode
│   │   │   │   └── ServiceNode
│   │   │   └── Edges (via ComponentFactory)
│   │   │       └── GatewayEdge
│   │   └── TopologyControlBar (zoom/fit controls)
│   └── GatewaySideBar (Drawer)
│       └── ResourceDetails (based on selected node)
│           ├── GatewayClassDetails
│           ├── GatewayDetails
│           ├── HTTPRouteDetails
│           └── ServiceDetails
└── StatusBox (loading/error states)
```

### Core Components

#### 1. GatewayTopologyPage.tsx

Main page component that orchestrates the topology view.

```typescript
export const GatewayTopologyPage: React.FC = () => {
  const { t } = useTranslation('plugin__gatewayapi-console-plugin');
  const [activeNamespace] = useActiveNamespace();
  
  return (
    <NamespacedPage>
      <Helmet>
        <title>{t('Gateway API Topology')}</title>
      </Helmet>
      <GatewayTopologyToolbar />
      <GatewayTopologyContent namespace={activeNamespace} />
    </NamespacedPage>
  );
};
```

#### 2. useGatewayTopologyModel Hook

Custom hook to watch resources and build the topology model.

```typescript
export const useGatewayTopologyModel = (
  namespace: string
): [Model, boolean, any] => {
  
  const resources = React.useMemo(() => ({
    gatewayClasses: {
      isList: true,
      kind: 'GatewayClass',
      apiVersion: 'gateway.networking.k8s.io/v1',
      namespaced: false,
    },
    gateways: {
      isList: true,
      kind: 'Gateway',
      namespace,
      apiVersion: 'gateway.networking.k8s.io/v1',
    },
    httpRoutes: {
      isList: true,
      kind: 'HTTPRoute',
      namespace,
      apiVersion: 'gateway.networking.k8s.io/v1',
    },
    services: {
      isList: true,
      kind: 'Service',
      namespace,
    },
  }), [namespace]);
  
  const watchedResources = useK8sWatchResources<GatewayAPIWatchedResources>(resources);
  
  const [model, loaded, loadError] = React.useMemo(() => {
    const allLoaded = Object.values(watchedResources).every(r => r.loaded || r.loadError);
    const errors = Object.values(watchedResources)
      .map(r => r.loadError)
      .filter(Boolean);
    
    if (!allLoaded) {
      return [{ nodes: [], edges: [] }, false, null];
    }
    
    if (errors.length > 0) {
      return [{ nodes: [], edges: [] }, true, errors[0]];
    }
    
    const topologyModel = buildGatewayTopologyModel(watchedResources);
    return [topologyModel, true, null];
  }, [watchedResources]);
  
  return [model, loaded, loadError];
};
```

#### 3. ComponentFactory

Maps node/edge types to React components.

```typescript
export const gatewayComponentFactory: ComponentFactory = (kind, type) => {
  switch (type) {
    case TYPE_GATEWAY_CLASS:
      return withSelection({ controlled: true })(
        withContextMenu()(GatewayClassNode)
      );
    
    case TYPE_GATEWAY:
      return withSelection({ controlled: true })(
        withContextMenu()(GatewayNode)
      );
    
    case TYPE_LISTENER:
      return withSelection({ controlled: true })(
        withContextMenu()(ListenerNode)
      );
    
    case TYPE_HTTP_ROUTE:
      return withSelection({ controlled: true })(
        withContextMenu()(HTTPRouteNode)
      );
    
    case TYPE_SERVICE:
      return withSelection({ controlled: true })(
        withContextMenu()(ServiceNode)
      );
    
    case TYPE_GATEWAY_TO_CLASS:
    case TYPE_LISTENER_TO_GATEWAY:
    case TYPE_ROUTE_TO_LISTENER:
    case TYPE_ROUTE_TO_SERVICE:
      return observer(GatewayEdge);
    
    default:
      if (kind === ModelKind.graph) {
        return withPanZoom()(GraphComponent);
      }
      return undefined;
  }
};
```

#### 4. Node Components

Each resource type gets its own node component extending a base pattern.

```typescript
// GatewayNode.tsx
export const GatewayNode: React.FC<NodeComponentProps> = observer(({ element }) => {
  const { t } = useTranslation('plugin__gatewayapi-console-plugin');
  const data = element.getData();
  const gateway = data.resource as Gateway;
  const status = getGatewayStatus(gateway);
  
  return (
    <DefaultNode
      element={element}
      badge={t('GW')}
      badgeColor="#0066CC"
      badgeClassName="gateway-topology-node__badge"
      className="gateway-topology-node gateway-topology-node--gateway"
    >
      <g transform={`translate(25, 25)`}>
        {/* Gateway Icon */}
        <GatewayIcon />
        
        {/* Status Decorator */}
        <StatusDecorator status={status} x={30} y={0} />
        
        {/* Listener Count Badge */}
        {gateway.spec.listeners && (
          <ListenerCountBadge 
            count={gateway.spec.listeners.length} 
            x={0} 
            y={30} 
          />
        )}
      </g>
    </DefaultNode>
  );
});
```

---

## Data Transformation Pipeline

### Step 1: Resource Watching

Use `useK8sWatchResources` to watch all Gateway API resources and Services.

```typescript
const resources = {
  gatewayClasses: {
    isList: true,
    kind: 'GatewayClass',
    apiVersion: 'gateway.networking.k8s.io/v1',
  },
  gateways: {
    isList: true,
    kind: 'Gateway',
    namespace,
    apiVersion: 'gateway.networking.k8s.io/v1',
  },
  httpRoutes: {
    isList: true,
    kind: 'HTTPRoute',
    namespace,
    apiVersion: 'gateway.networking.k8s.io/v1',
  },
  services: {
    isList: true,
    kind: 'Service',
    namespace,
  },
};
```

### Step 2: Model Building

Transform K8s resources into PatternFly Topology Model.

```typescript
export const buildGatewayTopologyModel = (
  resources: GatewayAPIWatchedResources
): Model => {
  const model: Model = { nodes: [], edges: [] };
  
  // 1. Create GatewayClass nodes (cluster-scoped)
  resources.gatewayClasses?.data?.forEach((gc: GatewayClass) => {
    model.nodes.push({
      id: getGatewayClassId(gc),
      type: TYPE_GATEWAY_CLASS,
      label: gc.metadata.name,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      data: {
        resource: gc,
        resourceKind: 'GatewayClass',
        status: getGatewayClassStatus(gc),
      },
    });
  });
  
  // 2. Create Gateway nodes and edges to GatewayClass
  resources.gateways?.data?.forEach((gw: Gateway) => {
    const gwId = getGatewayId(gw);
    
    model.nodes.push({
      id: gwId,
      type: TYPE_GATEWAY,
      label: gw.metadata.name,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      data: {
        resource: gw,
        resourceKind: 'Gateway',
        status: getGatewayStatus(gw),
        listeners: gw.spec.listeners,
      },
    });
    
    // Edge: Gateway → GatewayClass
    const gcId = getGatewayClassId({ metadata: { name: gw.spec.gatewayClassName } });
    model.edges.push({
      id: `${gwId}_to_${gcId}`,
      type: TYPE_GATEWAY_TO_CLASS,
      source: gwId,
      target: gcId,
      edgeStyle: EdgeStyle.solid,
    });
    
    // Optional: Create Listener nodes (child of Gateway)
    gw.spec.listeners?.forEach((listener, idx) => {
      const listenerId = `${gwId}_listener_${idx}`;
      model.nodes.push({
        id: listenerId,
        type: TYPE_LISTENER,
        label: listener.name,
        width: NODE_WIDTH * 0.75,
        height: NODE_HEIGHT * 0.75,
        data: {
          resource: gw,
          resourceKind: 'Listener',
          listener,
        },
      });
      
      // Edge: Listener → Gateway
      model.edges.push({
        id: `${listenerId}_to_${gwId}`,
        type: TYPE_LISTENER_TO_GATEWAY,
        source: listenerId,
        target: gwId,
      });
    });
  });
  
  // 3. Create HTTPRoute nodes and edges
  resources.httpRoutes?.data?.forEach((route: HTTPRoute) => {
    const routeId = getHTTPRouteId(route);
    
    model.nodes.push({
      id: routeId,
      type: TYPE_HTTP_ROUTE,
      label: route.metadata.name,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      data: {
        resource: route,
        resourceKind: 'HTTPRoute',
        status: getHTTPRouteStatus(route),
        rules: route.spec.rules,
      },
    });
    
    // Edges: HTTPRoute → Gateways (parentRefs)
    route.spec.parentRefs?.forEach((parentRef) => {
      if (parentRef.kind === 'Gateway' || !parentRef.kind) {
        const gwNamespace = parentRef.namespace || route.metadata.namespace;
        const gwId = getGatewayId({ 
          metadata: { 
            name: parentRef.name, 
            namespace: gwNamespace 
          } 
        });
        
        model.edges.push({
          id: `${routeId}_to_${gwId}_${parentRef.name}`,
          type: TYPE_ROUTE_TO_LISTENER,
          source: routeId,
          target: gwId, // or listener ID if listeners are separate nodes
          edgeStyle: EdgeStyle.solid,
        });
      }
    });
    
    // Edges: HTTPRoute → Services (backendRefs)
    route.spec.rules?.forEach((rule, ruleIdx) => {
      rule.backendRefs?.forEach((backendRef, backendIdx) => {
        if (backendRef.kind === 'Service' || !backendRef.kind) {
          const svcNamespace = backendRef.namespace || route.metadata.namespace;
          const svcId = getServiceId({
            metadata: {
              name: backendRef.name,
              namespace: svcNamespace,
            },
          });
          
          model.edges.push({
            id: `${routeId}_rule${ruleIdx}_to_${svcId}_${backendIdx}`,
            type: TYPE_ROUTE_TO_SERVICE,
            source: routeId,
            target: svcId,
            edgeStyle: EdgeStyle.solid,
          });
        }
      });
    });
  });
  
  // 4. Create Service nodes (only those referenced by routes)
  const referencedServices = getReferencedServices(resources.httpRoutes?.data || []);
  resources.services?.data?.forEach((svc: Service) => {
    const svcId = getServiceId(svc);
    if (referencedServices.has(svcId)) {
      model.nodes.push({
        id: svcId,
        type: TYPE_SERVICE,
        label: svc.metadata.name,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        data: {
          resource: svc,
          resourceKind: 'Service',
        },
      });
    }
  });
  
  return model;
};
```

### Step 3: Status Extraction

Extract status from Gateway API conditions.

```typescript
export const getGatewayStatus = (gateway: Gateway): NodeStatus => {
  const acceptedCondition = gateway.status?.conditions?.find(
    c => c.type === 'Accepted'
  );
  
  if (acceptedCondition?.status === 'True') {
    return NodeStatus.success;
  }
  
  if (acceptedCondition?.status === 'False') {
    return NodeStatus.danger;
  }
  
  return NodeStatus.warning;
};

export const getHTTPRouteStatus = (route: HTTPRoute): NodeStatus => {
  const acceptedCondition = route.status?.parents?.[0]?.conditions?.find(
    c => c.type === 'Accepted'
  );
  
  if (acceptedCondition?.status === 'True') {
    return NodeStatus.success;
  }
  
  if (acceptedCondition?.status === 'False') {
    return NodeStatus.danger;
  }
  
  return NodeStatus.warning;
};
```

---

## Visual Design

### Color Scheme

Based on PatternFly 6 color palette:

| Resource Type | Background Color | Meaning |
|--------------|------------------|---------|
| GatewayClass | `--pf-v6-global-palette--purple-500` | Foundation/Controller |
| Gateway | `--pf-v6-global-palette--blue-500` | Entry point |
| Listener | `--pf-v6-global-palette--cyan-500` | Protocol handler |
| HTTPRoute | `--pf-v6-global-palette--green-500` | Routing rules |
| Service | `--pf-v6-global-palette--orange-500` | Backend target |

### Node Dimensions

```typescript
export const NODE_WIDTH = 104;
export const NODE_HEIGHT = 104;
export const LISTENER_NODE_WIDTH = 78;
export const LISTENER_NODE_HEIGHT = 78;
```

### Layout Configuration

Use **DagreLayout** for hierarchical top-to-bottom flow:

```typescript
const layoutFactory: LayoutFactory = (type: string, graph: Graph) => {
  return new DagreLayout(graph, {
    rankdir: 'TB',        // Top to bottom
    nodesep: 60,          // Horizontal spacing between nodes
    ranksep: 100,         // Vertical spacing between ranks
    edgesep: 40,          // Spacing between edges
    marginx: 50,
    marginy: 50,
  });
};
```

**Hierarchical Levels**:
```
Level 0: GatewayClass
         ↓
Level 1: Gateway (with Listeners)
         ↓
Level 2: HTTPRoute
         ↓
Level 3: Service
```

### Edge Styling

```typescript
export const getEdgeStyle = (edgeType: string): EdgeStyle => {
  switch (edgeType) {
    case TYPE_GATEWAY_TO_CLASS:
      return EdgeStyle.dashed;  // Gateway references GatewayClass
    case TYPE_LISTENER_TO_GATEWAY:
      return EdgeStyle.dotted;  // Listener is part of Gateway
    case TYPE_ROUTE_TO_LISTENER:
      return EdgeStyle.solid;   // Route attaches to Gateway/Listener
    case TYPE_ROUTE_TO_SERVICE:
      return EdgeStyle.solid;   // Route forwards to Service
    default:
      return EdgeStyle.solid;
  }
};
```

### Status Indicators

Use PatternFly status colors:

```typescript
// Node border colors based on status
.gateway-topology-node {
  &--success {
    stroke: var(--pf-v6-global-palette--green-500);
  }
  &--warning {
    stroke: var(--pf-v6-global-palette--gold-500);
  }
  &--danger {
    stroke: var(--pf-v6-global-palette--red-500);
  }
}
```

---

## File Structure

```
gatewayapi-console-plugin/
├── src/
│   ├── components/
│   │   ├── GatewayTopologyPage.tsx          # Main page component
│   │   ├── GatewayTopologyToolbar.tsx       # Toolbar with controls
│   │   ├── GatewayTopologyContent.tsx       # Main content area
│   │   ├── GatewayTopologyView.tsx          # Visualization wrapper
│   │   │
│   │   ├── topology/
│   │   │   ├── components/
│   │   │   │   ├── nodes/
│   │   │   │   │   ├── GatewayClassNode.tsx
│   │   │   │   │   ├── GatewayNode.tsx
│   │   │   │   │   ├── ListenerNode.tsx
│   │   │   │   │   ├── HTTPRouteNode.tsx
│   │   │   │   │   └── ServiceNode.tsx
│   │   │   │   ├── edges/
│   │   │   │   │   └── GatewayEdge.tsx
│   │   │   │   └── GraphComponent.tsx
│   │   │   ├── componentFactory.ts         # Component factory
│   │   │   ├── layoutFactory.ts            # Layout factory
│   │   │   └── styles/
│   │   │       ├── gateway-topology.scss
│   │   │       ├── nodes.scss
│   │   │       └── edges.scss
│   │   │
│   │   └── sidebar/
│   │       ├── GatewaySideBar.tsx          # Sidebar wrapper
│   │       ├── GatewayClassDetails.tsx
│   │       ├── GatewayDetails.tsx
│   │       ├── HTTPRouteDetails.tsx
│   │       └── ServiceDetails.tsx
│   │
│   ├── hooks/
│   │   ├── useGatewayTopologyModel.ts      # Resource watching + model building
│   │   └── useGatewaySelection.ts          # Selection state management
│   │
│   ├── utils/
│   │   ├── gateway-model-builder.ts        # Model transformation logic
│   │   ├── gateway-status.ts               # Status extraction utilities
│   │   ├── gateway-utils.ts                # General utilities
│   │   └── gateway-constants.ts            # Constants (types, dimensions, etc.)
│   │
│   ├── types/
│   │   ├── gateway-api.ts                  # Gateway API resource types
│   │   └── topology.ts                     # Topology-specific types
│   │
│   └── assets/
│       └── icons/
│           ├── gateway-class-icon.svg
│           ├── gateway-icon.svg
│           ├── http-route-icon.svg
│           └── listener-icon.svg
│
├── console-extensions.json                  # Plugin extensions
├── package.json                             # Plugin metadata
├── tsconfig.json
├── webpack.config.ts
├── locales/
│   └── en/
│       └── plugin__gatewayapi-console-plugin.json
└── integration-tests/
    └── cypress/
        └── e2e/
            └── gateway-topology.cy.ts
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)

**Goal**: Basic topology view with GatewayClass and Gateway nodes

**Tasks**:
1. Set up project structure
2. Configure console extensions (page route, navigation)
3. Create TypeScript types for Gateway API resources
4. Implement `useGatewayTopologyModel` hook
5. Build basic model transformation for GatewayClass and Gateway
6. Create `GatewayClassNode` and `GatewayNode` components
7. Create `componentFactory` and `layoutFactory`
8. Render basic topology graph with DagreLayout

**Deliverable**: View showing GatewayClass nodes connected to Gateway nodes

### Phase 2: Complete Resource Graph (Week 2)

**Goal**: Add HTTPRoute and Service nodes with full relationships

**Tasks**:
1. Extend model builder for HTTPRoute resources
2. Extend model builder for Service resources
3. Create edge relationships (route-to-gateway, route-to-service)
4. Implement `HTTPRouteNode` and `ServiceNode` components
5. Implement `GatewayEdge` component with different edge styles
6. Add proper edge routing and styling

**Deliverable**: Complete topology showing all Gateway API resources and their relationships

### Phase 3: Status & Interaction (Week 3)

**Goal**: Add status indicators and interactive features

**Tasks**:
1. Implement status extraction utilities
2. Add status decorators to nodes (success/warning/danger)
3. Implement node selection
4. Add pan/zoom controls (TopologyControlBar)
5. Implement sidebar drawer
6. Create resource detail components for sidebar
7. Add hover effects and tooltips

**Deliverable**: Interactive topology with status indicators and detail sidebar

### Phase 4: Listeners & Advanced Features (Week 4)

**Goal**: Add Listener nodes and polish UX

**Tasks**:
1. Decide on Listener representation (separate nodes vs. decorators)
2. Implement Listener nodes (if separate)
3. Add listener badges to Gateway nodes (if decorators)
4. Implement toolbar controls (layout selector, namespace selector)
5. Add empty state handling
6. Add loading and error states
7. Implement i18n for all strings
8. Add comprehensive styling

**Deliverable**: Fully functional topology view with all features

### Phase 5: Testing & Documentation (Week 5)

**Goal**: Ensure quality and provide documentation

**Tasks**:
1. Write unit tests for utilities
2. Write component tests for nodes/edges
3. Create Cypress e2e tests
4. Write user documentation
5. Create demo video/screenshots
6. Performance optimization
7. Accessibility review

**Deliverable**: Production-ready plugin with tests and documentation

---

## Testing Strategy

### Unit Tests

**Framework**: Jest + React Testing Library

**Coverage Areas**:
- Model transformation logic (`gateway-model-builder.ts`)
- Status extraction utilities (`gateway-status.ts`)
- ID generation utilities (`gateway-utils.ts`)

**Example Test**:
```typescript
describe('buildGatewayTopologyModel', () => {
  it('should create nodes for all GatewayClasses', () => {
    const resources = {
      gatewayClasses: { data: [mockGatewayClass], loaded: true },
      gateways: { data: [], loaded: true },
      httpRoutes: { data: [], loaded: true },
      services: { data: [], loaded: true },
    };
    
    const model = buildGatewayTopologyModel(resources);
    
    expect(model.nodes).toHaveLength(1);
    expect(model.nodes[0].type).toBe(TYPE_GATEWAY_CLASS);
  });
});
```

### Integration Tests

**Framework**: Cypress

**Test Scenarios**:
1. Page loads without errors
2. Resources are fetched and displayed
3. Nodes are rendered correctly
4. Edges connect the right nodes
5. Selection works (click node → sidebar opens)
6. Zoom/pan controls work
7. Layout changes apply correctly
8. Namespace switching updates the view

**Example Test**:
```typescript
describe('Gateway Topology', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/gateway-topology/ns/test-namespace');
  });
  
  it('should display Gateway nodes', () => {
    cy.get('[data-kind="Gateway"]').should('exist');
  });
  
  it('should show sidebar on node selection', () => {
    cy.get('[data-kind="Gateway"]').first().click();
    cy.get('[data-test="topology-sidebar"]').should('be.visible');
  });
});
```

### Manual Testing Checklist

- [ ] All resource types render correctly
- [ ] Edges show proper connections
- [ ] Status colors reflect resource conditions
- [ ] Selection highlights the node
- [ ] Sidebar shows correct resource details
- [ ] Zoom in/out works smoothly
- [ ] Fit to screen button works
- [ ] Namespace selector filters correctly
- [ ] Empty state displays when no resources exist
- [ ] Loading state shows spinner
- [ ] Error state shows error message
- [ ] i18n works for all strings
- [ ] Dark mode compatible (if applicable)

---

## References

### Documentation

- [Console Dynamic Plugin SDK README](../console/frontend/packages/console-dynamic-plugin-sdk/README.md)
- [Console Extensions Documentation](../console/frontend/packages/console-dynamic-plugin-sdk/docs/console-extensions.md)
- [Console API Documentation](../console/frontend/packages/console-dynamic-plugin-sdk/docs/api.md)
- [PatternFly React Topology Documentation](https://www.patternfly.org/topology/react-topology/about-topology)
- [Gateway API Specification](https://gateway-api.sigs.k8s.io/)

### Example Projects

- [OpenShift Console Topology View](../console/frontend/packages/topology)
- [Networking Console Plugin](https://github.com/openshift/networking-console-plugin)
- [KubeVirt Plugin](https://github.com/kubevirt-ui/kubevirt-plugin)

### Related Files

- [TOPOLOGY_ARCHITECTURE_NOTES.md](./TOPOLOGY_ARCHITECTURE_NOTES.md) - Analysis of current Topology View
- [CLAUDE.md](./CLAUDE.md) - Plugin development guidelines

---

## Appendix

### Gateway API Resource Structure

#### GatewayClass

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: GatewayClass
metadata:
  name: istio
spec:
  controllerName: istio.io/gateway-controller
status:
  conditions:
    - type: Accepted
      status: "True"
```

#### Gateway

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: my-gateway
  namespace: default
spec:
  gatewayClassName: istio
  listeners:
    - name: http
      protocol: HTTP
      port: 80
    - name: https
      protocol: HTTPS
      port: 443
status:
  conditions:
    - type: Accepted
      status: "True"
  addresses:
    - value: 192.168.1.100
```

#### HTTPRoute

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: my-route
  namespace: default
spec:
  parentRefs:
    - name: my-gateway
  rules:
    - matches:
        - path:
            value: /api
      backendRefs:
        - name: api-service
          port: 8080
status:
  parents:
    - parentRef:
        name: my-gateway
      conditions:
        - type: Accepted
          status: "True"
```

### TypeScript Types

```typescript
// Gateway API v1 Types
export interface GatewayClass extends K8sResourceCommon {
  spec: {
    controllerName: string;
    parametersRef?: ObjectReference;
    description?: string;
  };
  status?: {
    conditions?: Condition[];
  };
}

export interface Gateway extends K8sResourceCommon {
  spec: {
    gatewayClassName: string;
    listeners: Listener[];
    addresses?: GatewayAddress[];
  };
  status?: {
    conditions?: Condition[];
    addresses?: GatewayAddress[];
    listeners?: ListenerStatus[];
  };
}

export interface Listener {
  name: string;
  hostname?: string;
  port: number;
  protocol: 'HTTP' | 'HTTPS' | 'TCP' | 'TLS' | 'UDP';
  tls?: GatewayTLSConfig;
  allowedRoutes?: AllowedRoutes;
}

export interface HTTPRoute extends K8sResourceCommon {
  spec: {
    parentRefs?: ParentReference[];
    hostnames?: string[];
    rules?: HTTPRouteRule[];
  };
  status?: {
    parents?: RouteParentStatus[];
  };
}

export interface HTTPRouteRule {
  matches?: HTTPRouteMatch[];
  filters?: HTTPRouteFilter[];
  backendRefs?: HTTPBackendRef[];
}

export interface HTTPBackendRef {
  name: string;
  namespace?: string;
  port?: number;
  kind?: string;
  weight?: number;
}
```

---

**End of Implementation Plan**
