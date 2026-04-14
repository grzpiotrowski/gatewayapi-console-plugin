// Gateway API Topology Page

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Page,
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
} from '@patternfly/react-core';
import {
  Visualization,
  VisualizationProvider,
  VisualizationSurface,
  Model,
  SELECTION_EVENT,
  SelectionEventListener,
} from '@patternfly/react-topology';
import { useActiveNamespace } from '@openshift-console/dynamic-plugin-sdk';
import { useGatewayTopologyModel } from '../hooks/useGatewayTopologyModel';
import { componentFactory } from './topology/componentFactory';
import { layoutFactory, LAYOUT_TYPE_DAGRE } from './topology/layoutFactory';
import { NamespaceSelector } from './NamespaceSelector';

import './GatewayTopologyPage.css';

const GatewayTopologyPage: React.FC = () => {
  const { t } = useTranslation('plugin__gatewayapi-console-plugin');
  const [activeNamespace] = useActiveNamespace();

  // Initialize with active namespace or empty (meaning all namespaces)
  const [selectedNamespaces, setSelectedNamespaces] = React.useState<string[]>(() => {
    return activeNamespace ? [activeNamespace] : [];
  });

  const [model, loaded, loadError] = useGatewayTopologyModel(selectedNamespaces);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

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
    };
    controller.addEventListener(SELECTION_EVENT, onSelect);
    return () => {
      controller.removeEventListener(SELECTION_EVENT, onSelect);
    };
  }, [controller]);

  // Loading state
  if (!loaded) {
    return (
      <Page>
        <PageSection>
          <Title headingLevel="h1">{t('Gateway API Topology')}</Title>
        </PageSection>
        <PageSection isFilled>
          <EmptyState>
            <Spinner />
            <Title headingLevel="h2" size="lg">
              {t('Loading topology')}
            </Title>
          </EmptyState>
        </PageSection>
      </Page>
    );
  }

  // Error state
  if (loadError) {
    return (
      <Page>
        <PageSection>
          <Title headingLevel="h1">{t('Gateway API Topology')}</Title>
        </PageSection>
        <PageSection isFilled>
          <Alert variant={AlertVariant.danger} title={t('Error loading topology')} isInline>
            <p>{loadError.message || t('An error occurred while loading the topology.')}</p>
          </Alert>
        </PageSection>
      </Page>
    );
  }

  // Empty state
  if (!model.nodes || model.nodes.length === 0) {
    const namespaceText =
      selectedNamespaces.length === 0
        ? t('No Gateway API resources were found in any namespace.')
        : selectedNamespaces.length === 1
          ? t('No Gateway API resources were found in the {{namespace}} namespace.', {
              namespace: selectedNamespaces[0],
            })
          : t('No Gateway API resources were found in the selected namespaces.');

    return (
      <Page>
        <PageSection>
          <Title headingLevel="h1">{t('Gateway API Topology')}</Title>
        </PageSection>
        <PageSection>
          <Toolbar>
            <ToolbarContent>
              <ToolbarItem>
                <NamespaceSelector
                  selectedNamespaces={selectedNamespaces}
                  onSelectionChange={setSelectedNamespaces}
                />
              </ToolbarItem>
            </ToolbarContent>
          </Toolbar>
        </PageSection>
        <PageSection isFilled>
          <EmptyState>
            <Title headingLevel="h2">{t('No Gateway API resources found')}</Title>
            <EmptyStateBody>{namespaceText}</EmptyStateBody>
            <EmptyStateBody>
              {t('Create a GatewayClass and Gateway to visualize your Gateway API configuration.')}
            </EmptyStateBody>
          </EmptyState>
        </PageSection>
      </Page>
    );
  }

  // Topology view
  return (
    <Page>
      <PageSection>
        <Title headingLevel="h1">{t('Gateway API Topology')}</Title>
      </PageSection>
      <PageSection>
        <Toolbar>
          <ToolbarContent>
            <ToolbarItem>
              <NamespaceSelector
                selectedNamespaces={selectedNamespaces}
                onSelectionChange={setSelectedNamespaces}
              />
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>
      </PageSection>
      <PageSection isFilled className="gatewayapi-console-plugin__topology-page">
        <VisualizationProvider controller={controller}>
          <VisualizationSurface state={{ selectedIds }} />
        </VisualizationProvider>
      </PageSection>
    </Page>
  );
};

export default GatewayTopologyPage;
