// Gateway API Topology Page

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  PageSection,
  Title,
  EmptyState,
  EmptyStateBody,
  Spinner,
  Alert,
  AlertVariant,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Card,
  CardTitle,
  CardBody,
  Drawer,
  DrawerContent,
  DrawerContentBody,
} from '@patternfly/react-core';
import {
  Visualization,
  VisualizationProvider,
  VisualizationSurface,
  TopologyView,
  Model,
  SELECTION_EVENT,
  SelectionEventListener,
  GraphElement,
} from '@patternfly/react-topology';
import {
  useActiveNamespace,
  ListPageCreateDropdown,
} from '@openshift-console/dynamic-plugin-sdk';
import { useGatewayTopologyModel } from '../hooks/useGatewayTopologyModel';
import { componentFactory } from './topology/componentFactory';
import { layoutFactory, LAYOUT_TYPE_DAGRE } from './topology/layoutFactory';
import { NamespaceSelector } from './NamespaceSelector';
import { TopologySideBar } from './topology/sidebar/TopologySideBar';

import './GatewayTopologyPage.css';
import './topology/components/edges/GatewayEdge.css';

const GatewayTopologyPage: React.FC = () => {
  const { t } = useTranslation('plugin__gatewayapi-console-plugin');
  const [activeNamespace] = useActiveNamespace();

  // Initialize with active namespace or empty (meaning all namespaces)
  const [selectedNamespaces, setSelectedNamespaces] = React.useState<string[]>(() => {
    return activeNamespace ? [activeNamespace] : [];
  });

  const [model, loaded, loadError] = useGatewayTopologyModel(selectedNamespaces);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [selectedElement, setSelectedElement] = React.useState<GraphElement | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState<boolean>(false);
  const [selectedResource, setSelectedResource] = React.useState<any>(null);
  const [creationContext, setCreationContext] = React.useState<
    | {
        template: any;
        resourceKind: string;
      }
    | undefined
  >(undefined);

  // Update selected namespaces when active namespace changes
  React.useEffect(() => {
    if (activeNamespace && !selectedNamespaces.includes(activeNamespace)) {
      setSelectedNamespaces([activeNamespace]);
    }
  }, [activeNamespace, selectedNamespaces]);

  // Debug logging
  React.useEffect(() => {
    console.log('[GatewayTopology] State:', {
      loaded,
      loadError,
      modelNodes: model.nodes?.length || 0,
      modelEdges: model.edges?.length || 0,
      namespace: activeNamespace,
    });
  }, [loaded, loadError, model, activeNamespace]);

  // Create visualization controller and initialize it with the model immediately
  const controller = React.useMemo(() => {
    console.log('[GatewayTopology] Creating and initializing controller');

    const newController = new Visualization();
    newController.registerLayoutFactory(layoutFactory);
    newController.registerComponentFactory(componentFactory);

    // Initialize with empty model immediately
    const initialModel: Model = {
      nodes: [],
      edges: [],
      graph: {
        id: 'gateway-topology-graph',
        type: 'graph',
        layout: LAYOUT_TYPE_DAGRE,
      },
    };

    newController.fromModel(initialModel, false);
    console.log('[GatewayTopology] Controller initialized with empty model');

    return newController;
  }, []);

  // Update model when data changes
  React.useEffect(() => {
    if (!loaded) {
      return;
    }

    console.log('[GatewayTopology] Updating model', {
      nodes: model.nodes?.length || 0,
      edges: model.edges?.length || 0,
    });

    const graphModel: Model = {
      nodes: model.nodes || [],
      edges: model.edges || [],
      graph: {
        id: 'gateway-topology-graph',
        type: 'graph',
        layout: LAYOUT_TYPE_DAGRE,
      },
    };

    try {
      controller.fromModel(graphModel, false);
      console.log('[GatewayTopology] Model updated successfully');
    } catch (error) {
      console.error('[GatewayTopology] Error updating topology model:', error);
    }
  }, [controller, model, loaded]);

  // Handle selection events
  React.useEffect(() => {
    const onSelect: SelectionEventListener = (ids: string[]) => {
      setSelectedIds(ids);

      if (ids.length > 0) {
        // Get the first selected element
        const element = controller.getElementById(ids[0]);
        if (element) {
          setSelectedElement(element);
          const data = element.getData();
          setSelectedResource(data?.resource || null);
          setIsSidebarOpen(true);
        }
      } else {
        setSelectedElement(null);
        setSelectedResource(null);
        setIsSidebarOpen(false);
      }
    };
    controller.addEventListener(SELECTION_EVENT, onSelect);
    return () => {
      controller.removeEventListener(SELECTION_EVENT, onSelect);
    };
  }, [controller]);

  // Update selected resource when model changes (for resource updates from watch)
  // Don't update selectedElement to avoid triggering tab reset
  React.useEffect(() => {
    if (selectedIds.length > 0 && loaded) {
      const element = controller.getElementById(selectedIds[0]);
      if (element) {
        // Only update the resource data, not the element reference
        // This allows YAML to refresh without resetting the active tab
        const data = element.getData();
        setSelectedResource(data?.resource || null);
      }
    }
  }, [controller, model, loaded, selectedIds]);

  // Handle sidebar close
  const handleSidebarClose = React.useCallback(() => {
    setIsSidebarOpen(false);
    setSelectedIds([]);
    setSelectedElement(null);
    setSelectedResource(null);
    setCreationContext(undefined);
  }, []);

  // Handle create resource request from detail components
  const handleCreateResource = React.useCallback((template: any, resourceKind: string) => {
    console.log('[GatewayTopology] Creating resource:', resourceKind, template);
    setCreationContext({ template, resourceKind });
    // Keep sidebar open in creation mode
    setIsSidebarOpen(true);
  }, []);

  // Handle successful resource creation
  const handleCreationSuccess = React.useCallback(
    (resource: any) => {
      console.log('[GatewayTopology] Resource created successfully:', resource);
      // Exit creation mode
      setCreationContext(undefined);

      // The model will automatically update via watch
      // After a short delay, try to select the new resource
      setTimeout(() => {
        const resourceId = `${resource.kind.toLowerCase()}-${resource.metadata?.namespace || 'cluster'}-${resource.metadata?.name}`;
        const element = controller.getElementById(resourceId);
        if (element) {
          // Select the element
          setSelectedIds([resourceId]);
          setSelectedElement(element);
          const data = element.getData();
          setSelectedResource(data?.resource || null);
        }
      }, 1000);
    },
    [controller],
  );

  // Handle creation cancellation
  const handleCreationCancel = React.useCallback(() => {
    console.log('[GatewayTopology] Creation cancelled');
    setCreationContext(undefined);
    // Optionally close sidebar or return to viewing selected element
  }, []);

  // Render
  return (
    <>
      <PageSection>
        <Title headingLevel="h1">{t('Gateway API Topology')}</Title>
        <Card>
          <CardTitle>{t('Topology View')}</CardTitle>
          <CardBody>
            {/* Toolbar with namespace selector and create button */}
            <Toolbar>
              <ToolbarContent>
                <ToolbarItem>
                  <NamespaceSelector
                    selectedNamespaces={selectedNamespaces}
                    onSelectionChange={setSelectedNamespaces}
                  />
                </ToolbarItem>
                <ToolbarItem align={{ default: 'alignEnd' }}>
                  <ListPageCreateDropdown
                    items={{
                      gatewayclass: t('Create GatewayClass'),
                      gateway: t('Create Gateway'),
                      httproute: t('Create HTTPRoute'),
                    }}
                    createAccessReview={{
                      groupVersionKind: {
                        group: 'gateway.networking.k8s.io',
                        version: 'v1',
                        kind: 'Gateway',
                      },
                    }}
                    onClick={(key) => {
                      const basePath =
                        selectedNamespaces.length === 1
                          ? `/k8s/ns/${selectedNamespaces[0]}`
                          : '/k8s/cluster';
                      let path = '';
                      switch (key) {
                        case 'gatewayclass':
                          path = `${basePath}/gateway.networking.k8s.io~v1~GatewayClass/~new`;
                          break;
                        case 'gateway':
                          path = `${basePath}/gateway.networking.k8s.io~v1~Gateway/~new`;
                          break;
                        case 'httproute':
                          path = `${basePath}/gateway.networking.k8s.io~v1~HTTPRoute/~new`;
                          break;
                      }
                      if (path) {
                        window.location.href = path;
                      }
                    }}
                  >
                    {t('Create')}
                  </ListPageCreateDropdown>
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>

            {/* Loading state */}
            {!loaded ? (
              <EmptyState>
                <Spinner />
                <Title headingLevel="h2" size="lg">
                  {t('Loading topology')}
                </Title>
              </EmptyState>
            ) : loadError ? (
              /* Error state */
              <Alert variant={AlertVariant.danger} title={t('Error loading topology')} isInline>
                <p>{loadError.message || t('An error occurred while loading the topology.')}</p>
              </Alert>
            ) : !model.nodes || model.nodes.length === 0 ? (
              /* Empty state */
              <EmptyState>
                <Title headingLevel="h2">{t('No Gateway API resources found')}</Title>
                <EmptyStateBody>
                  {selectedNamespaces.length === 0
                    ? t('No Gateway API resources were found in any namespace.')
                    : selectedNamespaces.length === 1
                      ? t('No Gateway API resources were found in the {{namespace}} namespace.', {
                          namespace: selectedNamespaces[0],
                        })
                      : t('No Gateway API resources were found in the selected namespaces.')}
                </EmptyStateBody>
                <EmptyStateBody>
                  {t(
                    'Create a GatewayClass and Gateway to visualize your Gateway API configuration.',
                  )}
                </EmptyStateBody>
              </EmptyState>
            ) : (
              /* Topology view with drawer sidebar */
              <Drawer isExpanded={isSidebarOpen} isInline>
                <DrawerContent
                  panelContent={
                    <TopologySideBar
                      onClose={handleSidebarClose}
                      selectedElement={selectedElement}
                      selectedResource={selectedResource}
                      creationContext={creationContext}
                      onCreationSuccess={handleCreationSuccess}
                      onCreationCancel={handleCreationCancel}
                      onCreateResource={handleCreateResource}
                    />
                  }
                >
                  <DrawerContentBody>
                    <TopologyView
                      style={{ height: '70vh' }}
                      className="gatewayapi-console-plugin__topology"
                    >
                      <VisualizationProvider controller={controller}>
                        <VisualizationSurface state={{ selectedIds }} />
                      </VisualizationProvider>
                    </TopologyView>
                  </DrawerContentBody>
                </DrawerContent>
              </Drawer>
            )}
          </CardBody>
        </Card>
      </PageSection>
    </>
  );
};

export default GatewayTopologyPage;
