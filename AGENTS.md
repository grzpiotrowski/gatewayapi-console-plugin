# Gateway API Console Plugin - AI Agent Instructions

This document provides context and guidelines for AI coding assistants working on the Gateway API Console Plugin codebase.

## Project Overview

This is an **OpenShift Console dynamic plugin** for visualizing and managing Gateway API resources in a topology view. Built on the [console-plugin-template](https://github.com/openshift/console-plugin-template), it provides visual representations of the relationships between GatewayClasses, Gateways, HTTPRoutes, and Services.

**Key Technologies:**
- TypeScript + React 18
- PatternFly 6 (UI component library)
- PatternFly React Topology (graph visualization)
- Webpack 5 with Module Federation
- react-i18next for internationalization
- OpenShift Console SDK (dynamic plugin integration)
- Helm for deployment

**Compatibility:** Requires OpenShift 4.12+ (uses ConsolePlugin CRD v1 API)

**Related Projects:** Based on patterns from [Kuadrant Console Plugin](https://github.com/kuadrant/console-plugin)

## Architecture & Patterns

### Dynamic Plugin System

This plugin uses webpack module federation to load at runtime into the OpenShift Console. Key files:

- `console-extensions.json`: Declares what the plugin adds to console (routes, nav items, etc.)
- `package.json` `consolePlugin` section: Plugin metadata and exposed modules mapping
- `webpack.config.ts`: Configures module federation and build

**Critical:** Any component referenced in `console-extensions.json` must have a corresponding entry in `package.json` under `consolePlugin.exposedModules`.

### Component Structure

- Use functional components with hooks (NO class components)
- All components should be TypeScript (`.tsx`)
- Follow PatternFly component patterns
- Use PatternFly CSS variables instead of hex colors (dark mode compatibility)

### Styling Constraints

**IMPORTANT:** The `.stylelintrc.yaml` enforces strict rules to prevent breaking console:

- **NO hex colors** - use PatternFly CSS variables (e.g., `var(--pf-v6-global-palette--blue-500)`)
- **NO naked element selectors** (like `table`, `div`) - prevents overwriting console styles
- **NO `.pf-` or `.co-` prefixed classes** - these are reserved for PatternFly and console
- **Prefix all custom classes** with plugin name (e.g., `console-plugin-template__nice`)

Don't disable these rules without understanding they protect against layout breakage!

## Internationalization (i18n)

**Namespace Convention:** `plugin__<plugin-name>` (e.g., `plugin__console-plugin-template`)

### In React Components:
```tsx
const { t } = useTranslation('plugin__console-plugin-template');
return <h1>{t('Hello, World!')}</h1>;
```

### In console-extensions.json:
```json
"name": "%plugin__console-plugin-template~My Label%"
```

**After adding/changing messages:** Run `yarn i18n` to update locale files in `/locales`

## Project Structure

```
gatewayapi-console-plugin/
├── src/
│   ├── components/              # React components
│   │   ├── topology/           # Topology visualization
│   │   │   ├── components/     # Nodes and edges
│   │   │   │   ├── nodes/     # GatewayNode, HTTPRouteNode, etc.
│   │   │   │   └── edges/     # GatewayEdge
│   │   │   ├── componentFactory.ts
│   │   │   └── layoutFactory.ts
│   │   ├── GatewayTopologyPage.tsx  # Main topology page
│   │   ├── NamespaceSelector.tsx
│   │   └── ExamplePage.tsx     # Template example (can be removed)
│   ├── hooks/                  # Custom React hooks
│   │   └── useGatewayTopologyModel.ts
│   ├── types/                  # TypeScript type definitions
│   │   └── gateway-api.ts
│   └── utils/                  # Utility functions
│       ├── gateway-constants.ts
│       ├── gateway-model-builder.ts
│       ├── gateway-status.ts
│       └── gateway-utils.ts
├── locales/                    # i18n translation files
│   └── en/
│       └── plugin__gatewayapi-console-plugin.json
├── charts/                     # Helm chart for deployment
├── docs/                       # Documentation
│   ├── TOPOLOGY_ARCHITECTURE_NOTES.md
│   └── topology_drawing_area_notes.md
├── console-extensions.json     # Extension declarations
├── package.json               # Plugin metadata
├── webpack.config.ts          # Build configuration
└── tsconfig.json             # TypeScript configuration
```

## Development Workflow

### Local Development
1. `yarn install` - install dependencies
2. `yarn start` - starts webpack dev server on port 9001 with CORS
3. `yarn start-console` - runs OpenShift console in container (requires cluster login)
4. Navigate to http://localhost:9000/example

### Code Quality
- `yarn lint` - runs eslint, prettier, and stylelint (with --fix)
- Linting is mandatory before commits
- Follow existing code patterns in the repo

### Testing
- `yarn test-cypress` - opens Cypress UI
- `yarn test-cypress-headless` - runs Cypress in CI mode
- Add e2e tests for new pages/features

## TypeScript Configuration

Current config has `strict: false` but enforces:
- `noUnusedLocals: true`
- All files should use `.tsx` extension
- Target: ES2020

**Modernization opportunity:** When touching files, consider enabling stricter TypeScript checks.

## Common Development Tasks

### Adding a New Page
1. Create component in `src/components/MyPage.tsx`
2. Add to `package.json` `exposedModules`: `"MyPage": "./components/MyPage"`
3. Add route in `console-extensions.json`:
   ```json
   {
     "type": "console.page/route",
     "properties": {
       "path": "/my-page",
       "component": { "$codeRef": "MyPage" }
     }
   }
   ```
4. Optional: Add nav item in `console-extensions.json`
5. Run `yarn i18n` if you added translatable strings

### Adding a Navigation Item
```json
{
  "type": "console.navigation/href",
  "properties": {
    "id": "my-nav-item",
    "name": "%plugin__console-plugin-template~My Page%",
    "href": "/my-page",
    "perspective": "admin",
    "section": "home"
  }
}
```

### Updating Plugin Name
When instantiating from template, update:
1. `package.json` - `name` and `consolePlugin.name`
2. `package.json` - `consolePlugin.displayName` and `description`
3. All i18n namespace references (`plugin__<name>`)
4. CSS class prefixes
5. Helm chart values

## Build & Deployment

### Building Image
```bash
docker build -t quay.io/my-repository/my-plugin:latest .
# For Apple Silicon: add --platform=linux/amd64
```

### Deploying via Helm
```bash
helm upgrade -i my-plugin charts/openshift-console-plugin \
  -n my-namespace \
  --create-namespace \
  --set plugin.image=my-plugin-image-location
```

**Note:** OpenShift 4.10 requires `--set plugin.securityContext.enabled=false`

## Important Constraints & Gotchas

1. **Template, not fork:** Users should use "Use this template", not fork
2. **i18n namespace must match ConsolePlugin resource name** with `plugin__` prefix
3. **CSS class prefixes prevent style conflicts** - always prefix with plugin name
4. **Module federation requires exact module mapping** - `exposedModules` must match `$codeRef` values
5. **PatternFly CSS variables only** - hex colors break dark mode
6. **No webpack HMR for extensions** - changes to `console-extensions.json` require restart
7. **TypeScript not in strict mode** - legacy choice, can be modernized
8. **React 17, not 18** - matches console's React version

## Gateway API Resources

The plugin manages and visualizes these Kubernetes Gateway API resources:

### Core Resources
1. **GatewayClass** (`gateway.networking.k8s.io/v1`) - Gateway infrastructure template
   - Cluster-scoped resource
   - Defines the controller responsible for Gateways
   - Top-level node in topology

2. **Gateway** (`gateway.networking.k8s.io/v1`) - Application-level gateway
   - Namespace-scoped resource
   - References a GatewayClass
   - Defines listeners (ports, protocols, hostnames)
   - Second-level node in topology

3. **HTTPRoute** (`gateway.networking.k8s.io/v1`) - HTTP routing rules
   - Namespace-scoped resource
   - Attaches to Gateway via `parentRefs`
   - Defines URL path matching and backend routing
   - Third-level node in topology

4. **Service** (`v1`) - Kubernetes Service backends
   - Namespace-scoped resource
   - Referenced by HTTPRoute `backendRefs`
   - Bottom-level node in topology

## Common Patterns

### 1. Resource Watching (Real-time Updates)
```typescript
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';

// Watch Gateway resources in a specific namespace
const [gateways, loaded, error] = useK8sWatchResource<Gateway[]>({
  groupVersionKind: {
    group: 'gateway.networking.k8s.io',
    version: 'v1',
    kind: 'Gateway',
  },
  isList: true,
  namespace: activeNamespace, // or undefined for all namespaces
});
```

**IMPORTANT:** Always use `useK8sWatchResource` instead of `k8sList` for resources that need real-time updates. This ensures the UI updates automatically when resources change in the cluster.

### 2. Topology Model Building
The topology view follows a specific pattern:
1. Fetch resources using `useK8sWatchResource`
2. Transform resources into nodes and edges
3. Create a `Model` object with graph layout
4. Pass to `Visualization.fromModel()`

**Key files:**
- `hooks/useGatewayTopologyModel.ts` - Resource fetching and model creation
- `utils/gateway-model-builder.ts` - Transformation logic
- `components/topology/componentFactory.ts` - Maps types to React components
- `components/topology/layoutFactory.ts` - Graph layout configuration

### 3. Component Factory Pattern
```typescript
export const componentFactory: ComponentFactory = (kind, type) => {
  switch (type) {
    case TYPE_GATEWAY_CLASS:
      return GatewayClassNode;
    case TYPE_GATEWAY:
      return GatewayNode;
    case TYPE_HTTP_ROUTE:
      return HTTPRouteNode;
    case TYPE_SERVICE:
      return ServiceNode;
    case ModelKind.graph:
      return withPanZoom()(GraphComponent);
    default:
      return undefined;
  }
};
```

This maps custom node types to their visual components.

### 4. Layout Factory Pattern
```typescript
export const layoutFactory: LayoutFactory = (type: string, graph) => {
  switch (type) {
    case LAYOUT_TYPE_DAGRE:
      return new DagreLayout(graph, {
        rankdir: 'LR',              // Left-to-right
        ranker: 'network-simplex',  // Layout algorithm
        nodesep: 50,                // Horizontal spacing
        edgesep: 30,                // Edge spacing
      });
    default:
      return new ColaLayout(graph);
  }
};
```

Controls how nodes are positioned in the topology.

### 5. Error Handling
```typescript
const [errorMsg, setErrorMsg] = useState<string>('');

try {
  await k8sCreate({ model, data: resource });
  history.push(redirectUrl);
} catch (error) {
  const message = error.message || 'An error occurred';
  setErrorMsg(message);
  console.error('[GatewayAPI] Error:', error);
}

// Display error to user
{errorMsg && (
  <Alert variant="danger" title="Error" isInline>
    {errorMsg}
  </Alert>
)}
```

### 6. Logging Convention
Use consistent prefixes for debugging:
```typescript
console.log('[GatewayTopology] Initializing visualization controller');
console.error('[GatewayAPI] Failed to fetch resources:', error);
console.debug('[ModelBuilder] Processing nodes:', nodes.length);
```

## Topology Architecture

The topology view is built on **PatternFly React Topology** and follows the OpenShift Console topology patterns.

### Key Design Decisions

**1. Layout Structure (matches OpenShift Console)**
```tsx
<div className="gatewayapi-console-plugin__topology">  {/* Grid container */}
  <Stack hasGutter={false}>
    <StackItem isFilled={false}>                        {/* Toolbar - fixed height */}
      <Toolbar>
        <NamespaceSelector />
      </Toolbar>
    </StackItem>
    
    <StackItem isFilled>                                {/* Graph - fills space */}
      <Drawer isExpanded={false} isInline>
        <DrawerContent>
          <DrawerContentBody>
            <div className="...topology-content">
              <div className="...topology-graph-view">  {/* Absolute positioned */}
                <VisualizationProvider controller={controller}>
                  <VisualizationSurface state={{ selectedIds }} />
                </VisualizationProvider>
              </div>
            </div>
          </DrawerContentBody>
        </DrawerContent>
      </Drawer>
    </StackItem>
  </Stack>
</div>
```

**CSS Positioning:**
- `.gatewayapi-console-plugin__topology` - CSS Grid with `height: 100%`
- `.gatewayapi-console-plugin__topology-graph-view` - Absolute positioned (`top: 0; bottom: 0; left: 0; right: 0`)
- Firefox workaround using `@-moz-document url-prefix()`

**2. Controller Lifecycle**
- Controller is created once on mount using `useMemo` with empty dependencies
- Never recreated during component lifecycle (prevents view resets)
- Component factory and layout factory registered at creation time

**3. State Management**
- Use `useState` for values that affect rendering
- Use `useRef` for stable references that don't trigger re-renders (e.g., controller)
- Use `useMemo` for expensive computations (e.g., model building)

### Data Flow
```
K8s Resources (GatewayClass, Gateway, HTTPRoute, Service)
    ↓ (useK8sWatchResource)
useGatewayTopologyModel hook
    ↓ (buildTopologyModel)
Model { nodes: [], edges: [], graph: {} }
    ↓ (Visualization.fromModel)
componentFactory (type → React component)
layoutFactory (positioning algorithm)
    ↓
VisualizationSurface (renders SVG)
```

## Extension Points

See [Console Plugin SDK README](https://github.com/openshift/console/tree/master/frontend/packages/console-dynamic-plugin-sdk) for available extension types:

- `console.page/route` - add new pages
- `console.navigation/href` - add nav items
- `console.navigation/section` - add nav sections
- `console.tab` - add tabs to resource pages
- `console.action/provider` - add actions to resources
- `console.model-metadata` - register custom resource types
- `console.flag` - feature flags
- Many more...

## Code Style Preferences

- Functional components with hooks (NO classes)
- TypeScript for all new files
- Use PatternFly components whenever possible
- Keep components focused and composable
- Prefer named exports for components
- Use `React.FC` or explicit return types
- CSS-in-files (not CSS-in-JS)

## Testing Strategy

- **E2E tests (Cypress):** For user flows and page rendering
- **Component tests:** Add when components have complex logic
- **Test data attributes:** Use `data-test` attributes for selectors
- Run tests locally before opening PRs

## References

- [Console Plugin SDK](https://github.com/openshift/console/tree/master/frontend/packages/console-dynamic-plugin-sdk)
- [PatternFly React](https://www.patternfly.org/get-started/develop)
- [Dynamic Plugin Enhancement Proposal](https://github.com/openshift/enhancements/blob/master/enhancements/console/dynamic-plugins.md)

## Common Issues and Solutions

### 1. Topology View Not Rendering
**Symptoms:** Blank topology area, no nodes visible

**Possible Causes:**
- Controller not initialized properly
- Model has no nodes
- Height not propagating to visualization surface
- Component factory not returning correct components

**Solutions:**
- Check browser console for errors
- Verify `controller.fromModel()` is called with valid model
- Ensure `.gatewayapi-console-plugin__topology` has `height: 100%`
- Verify `componentFactory` returns components for all node types

### 2. Topology View Resetting on Updates
**Symptoms:** Pan/zoom position resets when resources update

**Cause:** Controller being recreated, causing view state loss

**Solution:**
- Ensure controller is created with `useMemo` with empty dependency array
- Never recreate controller during component lifecycle
- Check that dependencies in `useMemo` don't change

```typescript
// ✅ CORRECT - Controller created once
const controller = useMemo(() => {
  const ctrl = new Visualization();
  ctrl.registerLayoutFactory(layoutFactory);
  ctrl.registerComponentFactory(componentFactory);
  return ctrl;
}, []); // Empty deps = create once

// ❌ WRONG - Controller recreated on every render
const controller = new Visualization();
```

### 3. Resources Not Updating in Real-Time
**Symptoms:** Topology doesn't update when resources change in cluster

**Cause:** Using `k8sList` instead of `useK8sWatchResource`

**Solution:**
```typescript
// ❌ WRONG - One-time fetch
const gateways = await k8sList({ model: GatewayModel });

// ✅ CORRECT - Real-time updates
const [gateways, loaded, error] = useK8sWatchResource<Gateway[]>({
  groupVersionKind: { ... },
  isList: true,
  namespace,
});
```

### 4. CSS Bleeding into Console
**Symptoms:** Plugin styles affect other parts of OpenShift Console

**Cause:** Global CSS selectors without plugin prefix

**Solution:**
```css
/* ❌ WRONG - Affects entire console */
.pf-v6-c-table__td { padding: 0; }

/* ✅ CORRECT - Scoped to plugin */
.gatewayapi-console-plugin__table .pf-v6-c-table__td { padding: 0; }
```

### 5. Dark Theme Text Not Visible
**Symptoms:** Text invisible or hard to read in dark theme

**Cause:** Using light-theme-only colors

**Solution:**
```css
/* ✅ Use theme-aware selectors */
.gatewayapi-console-plugin__node-label {
  color: var(--pf-v6-global--Color--100); /* Light theme */
}

.pf-v6-theme-dark .gatewayapi-console-plugin__node-label {
  color: var(--pf-v6-global--Color--dark-100); /* Dark theme */
}
```

### 6. Module Not Found Errors
**Symptoms:** `Module not found: Can't resolve './components/MyPage'`

**Cause:** Mismatch between `exposedModules` in `package.json` and actual file paths

**Solution:**
- Verify file path is relative to `src/`
- Check that component is exported correctly
- Ensure `$codeRef` in `console-extensions.json` matches key in `exposedModules`

### 7. i18n Keys Not Translating
**Symptoms:** Seeing `%plugin__gatewayapi-console-plugin~My Key%` instead of translation

**Cause:** Translation files not updated or incorrect namespace

**Solution:**
1. Run `yarn i18n` to regenerate translation files
2. Verify namespace matches plugin name: `plugin__gatewayapi-console-plugin`
3. Check `locales/en/plugin__gatewayapi-console-plugin.json` has the key

### 8. Build Errors After Dependency Update
**Symptoms:** Webpack build fails after `yarn add/upgrade`

**Solution:**
```bash
yarn clean
rm -rf node_modules yarn.lock
yarn install
yarn build
```

### 9. Topology Nodes Overlapping
**Symptoms:** Nodes positioned on top of each other

**Cause:** Layout factory not configured correctly

**Solution:**
- Increase `nodesep` and `edgesep` in DagreLayout config
- Verify node width/height are set in model
- Check that layout type is registered in layoutFactory

### 10. useEffect Running Too Often
**Symptoms:** Performance issues, excessive re-renders

**Cause:** Missing or incorrect dependencies in useEffect

**Solution:**
```typescript
// Use useDeepCompareMemoize for object/array dependencies
import { useDeepCompareMemoize } from '@console/shared';

const memoizedModel = useDeepCompareMemoize(model);

useEffect(() => {
  controller.fromModel(memoizedModel);
}, [controller, memoizedModel]); // Now only runs when model actually changes
```

## PatternFly 6 Notes

The plugin uses PatternFly 6 (latest version).

### Key Changes from PF5
- `Text/TextContent` → `Content`
- `EmptyState` structure simplified
- CSS variables: `--pf-global--` → `--pf-v6-global--`
- Modal imports from `@patternfly/react-core` (not deprecated)

### Always Test Both Themes
- Light theme (default)
- Dark theme (click user menu → Appearance → Dark)

## Code Style Guidelines

### React Patterns
- **Functional components only** - No class components
- **TypeScript for all new files** - Use `.tsx` extension
- **Explicit return types** - Use `React.FC` or define return type
- **Named exports** - Prefer `export const MyComponent` over default exports

### CSS Patterns
- **Always use plugin prefix** - `gatewayapi-console-plugin__`
- **PatternFly variables only** - No hex colors
- **BEM for component styles** - `component__element--modifier`
- **Scope global selectors** - Never use bare `.pf-*` or element selectors

### Import Organization
```typescript
// 1. React and external libraries
import * as React from 'react';
import { useTranslation } from 'react-i18next';

// 2. PatternFly components
import { Page, PageSection, Title } from '@patternfly/react-core';
import { Visualization, VisualizationSurface } from '@patternfly/react-topology';

// 3. OpenShift Console SDK
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';

// 4. Internal imports
import { useGatewayTopologyModel } from '../hooks/useGatewayTopologyModel';
import { componentFactory } from './topology/componentFactory';

// 5. Styles (last)
import './GatewayTopologyPage.css';
```

## Quick Decision Guide

**When should I...**

- **Add a page?** Update `console-extensions.json` + `exposedModules` + create component
- **Add a topology node type?** Create component in `src/components/topology/components/nodes/`, add to componentFactory
- **Style something?** Use PatternFly components first, CSS variables for colors, prefix custom classes
- **Add translations?** Use `t()` function, run `yarn i18n` after
- **Watch K8s resources?** Use `useK8sWatchResource` for real-time updates
- **Test changes?** Run locally with `yarn start` + `yarn start-console`, test both light and dark themes
- **Deploy?** Build image, push to registry, install via Helm chart

## Contributing Guidelines

When adding new features:
1. Follow existing component patterns (see `GatewayTopologyPage.tsx`)
2. Add types for new resources in `src/types/`
3. Update `console-extensions.json` for new routes/nav items
4. Add i18n keys and run `yarn i18n`
5. Test with local OpenShift console instance
6. Test both light and dark themes
7. Document complex logic with comments
8. Add logging with `[GatewayAPI]` prefix for debugging

## Additional Resources

- **GUIDELINES.md** - Detailed project structure and organization guidelines
- **TOPOLOGY_ARCHITECTURE_NOTES.md** - Topology implementation deep-dive
- **topology_drawing_area_notes.md** - Layout and styling analysis
- [Console Plugin SDK](https://github.com/openshift/console/tree/master/frontend/packages/console-dynamic-plugin-sdk)
- [PatternFly React](https://www.patternfly.org/get-started/develop)
- [PatternFly React Topology](https://www.patternfly.org/topology/about-topology)
- [Kuadrant Console Plugin](https://github.com/kuadrant/console-plugin) - Reference implementation
