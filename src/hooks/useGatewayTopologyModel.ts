// Hook to watch Gateway API resources and build topology model

import * as React from 'react';
import { Model } from '@patternfly/react-topology';
import { useK8sWatchResources } from '@openshift-console/dynamic-plugin-sdk';
import { GATEWAY_API_GROUP, GATEWAY_API_VERSION } from '../utils/gateway-constants';
import {
  buildGatewayTopologyModel,
  GatewayAPIWatchedResources,
} from '../utils/gateway-model-builder';
import { Gateway, GatewayClass, HTTPRoute, Service } from '../types/gateway-api';

/**
 * Hook to watch Gateway API resources and build the topology model
 * Phase 2: Watches GatewayClass, Gateway, HTTPRoute, and Service resources
 *
 * @param selectedNamespaces - Array of namespaces to watch (empty array for all namespaces)
 * @returns [model, loaded, loadError]
 */
export const useGatewayTopologyModel = (selectedNamespaces: string[]): [Model, boolean, any] => {
  // Watch all namespaces, filter client-side
  // Empty array means show all namespaces
  const watchAllNamespaces = selectedNamespaces.length === 0;

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
        namespace: undefined, // Always watch all, filter client-side
        namespaced: true,
      },
      httpRoutes: {
        isList: true,
        groupVersionKind: {
          group: GATEWAY_API_GROUP,
          version: GATEWAY_API_VERSION,
          kind: 'HTTPRoute',
        },
        namespace: undefined, // Always watch all, filter client-side
        namespaced: true,
      },
      services: {
        isList: true,
        groupVersionKind: {
          version: 'v1',
          kind: 'Service',
        },
        namespace: undefined, // Always watch all, filter client-side
        namespaced: true,
      },
    }),
    [],
  );

  // Watch the resources
  const rawWatchedResources = useK8sWatchResources<{
    gatewayClasses: GatewayClass[];
    gateways: Gateway[];
    httpRoutes: HTTPRoute[];
    services: Service[];
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
      httpRoutes: {
        loaded: rawWatchedResources.httpRoutes.loaded,
        error: rawWatchedResources.httpRoutes.loadError,
        dataCount: rawWatchedResources.httpRoutes.data?.length || 0,
      },
      services: {
        loaded: rawWatchedResources.services.loaded,
        error: rawWatchedResources.services.loadError,
        dataCount: rawWatchedResources.services.data?.length || 0,
      },
    });

    const allLoaded =
      (rawWatchedResources.gatewayClasses.loaded ||
        !!rawWatchedResources.gatewayClasses.loadError) &&
      (rawWatchedResources.gateways.loaded || !!rawWatchedResources.gateways.loadError) &&
      (rawWatchedResources.httpRoutes.loaded || !!rawWatchedResources.httpRoutes.loadError) &&
      (rawWatchedResources.services.loaded || !!rawWatchedResources.services.loadError);

    if (!allLoaded) {
      console.log('[useGatewayTopologyModel] Not all loaded yet');
      return [{ nodes: [], edges: [] }, false, null];
    }

    const error =
      rawWatchedResources.gatewayClasses.loadError ||
      rawWatchedResources.gateways.loadError ||
      rawWatchedResources.httpRoutes.loadError ||
      rawWatchedResources.services.loadError;
    if (error) {
      console.error('[useGatewayTopologyModel] Load error:', error);
      return [{ nodes: [], edges: [] }, true, error];
    }

    // Filter resources by selected namespaces
    const allGateways = (rawWatchedResources.gateways.data || []) as Gateway[];
    const allHTTPRoutes = (rawWatchedResources.httpRoutes.data || []) as HTTPRoute[];
    const allServices = (rawWatchedResources.services.data || []) as Service[];

    const filteredGateways = watchAllNamespaces
      ? allGateways
      : allGateways.filter((gw) => selectedNamespaces.includes(gw.metadata?.namespace || ''));

    const filteredHTTPRoutes = watchAllNamespaces
      ? allHTTPRoutes
      : allHTTPRoutes.filter((route) =>
          selectedNamespaces.includes(route.metadata?.namespace || ''),
        );

    const filteredServices = watchAllNamespaces
      ? allServices
      : allServices.filter((svc) => selectedNamespaces.includes(svc.metadata?.namespace || ''));

    // Convert WatchK8sResults to GatewayAPIWatchedResources format
    const watchedResources: GatewayAPIWatchedResources = {
      gatewayClasses: {
        data: (rawWatchedResources.gatewayClasses.data || []) as GatewayClass[],
        loaded: rawWatchedResources.gatewayClasses.loaded,
        loadError: rawWatchedResources.gatewayClasses.loadError,
      },
      gateways: {
        data: filteredGateways,
        loaded: rawWatchedResources.gateways.loaded,
        loadError: rawWatchedResources.gateways.loadError,
      },
      httpRoutes: {
        data: filteredHTTPRoutes,
        loaded: rawWatchedResources.httpRoutes.loaded,
        loadError: rawWatchedResources.httpRoutes.loadError,
      },
      services: {
        data: filteredServices,
        loaded: rawWatchedResources.services.loaded,
        loadError: rawWatchedResources.services.loadError,
      },
    };

    const topologyModel = buildGatewayTopologyModel(watchedResources);
    return [topologyModel, true, null];
  }, [rawWatchedResources, selectedNamespaces, watchAllNamespaces]);

  return [model, loaded, loadError];
};
