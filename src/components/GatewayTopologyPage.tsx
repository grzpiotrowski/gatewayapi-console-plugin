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

import './GatewayTopologyPage.css';

const GatewayTopologyPage: React.FC = () => {
  const { t } = useTranslation('plugin__gatewayapi-console-plugin');
  const [activeNamespace] = useActiveNamespace();
  const [model, loaded, loadError] = useGatewayTopologyModel(activeNamespace);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

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
    return (
      <Page>
        <PageSection>
          <Title headingLevel="h1">{t('Gateway API Topology')}</Title>
        </PageSection>
        <PageSection isFilled>
          <EmptyState>
            <Title headingLevel="h2">
              {t('No Gateway API resources found')}
            </Title>
            <EmptyStateBody>
              {activeNamespace
                ? t('No Gateway API resources were found in the {{namespace}} namespace.', {
                    namespace: activeNamespace,
                  })
                : t('No Gateway API resources were found in any namespace.')}
            </EmptyStateBody>
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
        {activeNamespace && (
          <p className="pf-v6-u-color-200">
            {t('Namespace: {{namespace}}', { namespace: activeNamespace })}
          </p>
        )}
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
