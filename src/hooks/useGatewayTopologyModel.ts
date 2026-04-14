// Hook to watch Gateway API resources and build topology model

import * as React from 'react';
import { Model } from '@patternfly/react-topology';
import { useK8sWatchResources } from '@openshift-console/dynamic-plugin-sdk';
import { GATEWAY_API_GROUP, GATEWAY_API_VERSION } from '../utils/gateway-constants';
import { buildGatewayTopologyModel, GatewayAPIWatchedResources } from '../utils/gateway-model-builder';
import { Gateway, GatewayClass } from '../types/gateway-api';

/**
 * Hook to watch Gateway API resources and build the topology model
 * Phase 1: Watches GatewayClass and Gateway resources only
 *
 * @param namespace - The namespace to watch (empty string for all namespaces)
 * @returns [model, loaded, loadError]
 */
export const useGatewayTopologyModel = (namespace: string): [Model, boolean, any] => {
  // Define resources to watch
  const resources = React.useMemo(
    () => ({
      gatewayClasses: {
        isList: true,
        groupVersionKind: {
          group: GATEWAY_API_GROUP,
          version: GATEWAY_API_VERSION,
          kind: 'GatewayClass',
        },
        namespaced: false,
      },
      gateways: {
        isList: true,
        groupVersionKind: {
          group: GATEWAY_API_GROUP,
          version: GATEWAY_API_VERSION,
          kind: 'Gateway',
        },
        namespace: namespace || undefined,
        namespaced: true,
      },
    }),
    [namespace],
  );

  // Watch the resources
  const rawWatchedResources = useK8sWatchResources<{
    gatewayClasses: GatewayClass[];
    gateways: Gateway[];
  }>(resources);

  // Build the model when resources change
  const [model, loaded, loadError] = React.useMemo(() => {
    console.log('[useGatewayTopologyModel] Raw resources:', {
      gatewayClasses: {
        loaded: rawWatchedResources.gatewayClasses.loaded,
        error: rawWatchedResources.gatewayClasses.loadError,
        dataCount: rawWatchedResources.gatewayClasses.data?.length || 0,
      },
      gateways: {
        loaded: rawWatchedResources.gateways.loaded,
        error: rawWatchedResources.gateways.loadError,
        dataCount: rawWatchedResources.gateways.data?.length || 0,
      },
    });

    const allLoaded =
      (rawWatchedResources.gatewayClasses.loaded || !!rawWatchedResources.gatewayClasses.loadError) &&
      (rawWatchedResources.gateways.loaded || !!rawWatchedResources.gateways.loadError);

    if (!allLoaded) {
      console.log('[useGatewayTopologyModel] Not all loaded yet');
      return [{ nodes: [], edges: [] }, false, null];
    }

    const error = rawWatchedResources.gatewayClasses.loadError || rawWatchedResources.gateways.loadError;
    if (error) {
      console.error('[useGatewayTopologyModel] Load error:', error);
      if (rawWatchedResources.gatewayClasses.loadError) {
        console.error('  - GatewayClass error:', rawWatchedResources.gatewayClasses.loadError);
      }
      if (rawWatchedResources.gateways.loadError) {
        console.error('  - Gateway error:', rawWatchedResources.gateways.loadError);
      }
      return [{ nodes: [], edges: [] }, true, error];
    }

    // Convert WatchK8sResults to GatewayAPIWatchedResources format
    const watchedResources: GatewayAPIWatchedResources = {
      gatewayClasses: {
        data: (rawWatchedResources.gatewayClasses.data || []) as GatewayClass[],
        loaded: rawWatchedResources.gatewayClasses.loaded,
        loadError: rawWatchedResources.gatewayClasses.loadError,
      },
      gateways: {
        data: (rawWatchedResources.gateways.data || []) as Gateway[],
        loaded: rawWatchedResources.gateways.loaded,
        loadError: rawWatchedResources.gateways.loadError,
      },
    };

    const topologyModel = buildGatewayTopologyModel(watchedResources);
    return [topologyModel, true, null];
  }, [rawWatchedResources]);

  return [model, loaded, loadError];
};
