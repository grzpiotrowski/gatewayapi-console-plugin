// Gateway API Topology Model Builder

import { Model, NodeModel, EdgeModel, EdgeStyle } from '@patternfly/react-topology';
import { Gateway, GatewayClass, HTTPRoute, Service } from '../types/gateway-api';
import {
  TYPE_GATEWAY_CLASS,
  TYPE_GATEWAY,
  TYPE_HTTP_ROUTE,
  TYPE_SERVICE,
  TYPE_GATEWAY_TO_CLASS,
  TYPE_ROUTE_TO_LISTENER,
  TYPE_ROUTE_TO_SERVICE,
  NODE_WIDTH,
  NODE_HEIGHT,
} from './gateway-constants';
import {
  getGatewayClassId,
  getGatewayId,
  getHTTPRouteId,
  getServiceId,
  getResourceLabel,
  getReferencedServices,
} from './gateway-utils';
import { getGatewayClassStatus, getGatewayStatus, getHTTPRouteStatus } from './gateway-status';

export interface GatewayAPIWatchedResources {
  gatewayClasses: {
    data: GatewayClass[];
    loaded: boolean;
    loadError?: any;
  };
  gateways: {
    data: Gateway[];
    loaded: boolean;
    loadError?: any;
  };
  httpRoutes?: {
    data: HTTPRoute[];
    loaded: boolean;
    loadError?: any;
  };
  services?: {
    data: Service[];
    loaded: boolean;
    loadError?: any;
  };
}

/**
 * Build the Gateway API topology model from watched resources
 * Phase 2: GatewayClass, Gateway, HTTPRoute, and Service nodes
 */
export const buildGatewayTopologyModel = (resources: GatewayAPIWatchedResources): Model => {
  const nodes: NodeModel[] = [];
  const edges: EdgeModel[] = [];

  // 1. Create GatewayClass nodes (cluster-scoped)
  if (resources.gatewayClasses?.data) {
    resources.gatewayClasses.data.forEach((gc: GatewayClass) => {
      const gcId = getGatewayClassId(gc);

      const node: NodeModel = {
        id: gcId,
        type: TYPE_GATEWAY_CLASS,
        label: getResourceLabel(gc),
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        data: {
          resource: gc,
          resourceKind: 'GatewayClass',
          status: getGatewayClassStatus(gc),
        },
      };

      nodes.push(node);
    });
  }

  // 2. Create Gateway nodes and edges to GatewayClass
  if (resources.gateways?.data) {
    resources.gateways.data.forEach((gw: Gateway) => {
      const gwId = getGatewayId(gw);

      const node: NodeModel = {
        id: gwId,
        type: TYPE_GATEWAY,
        label: getResourceLabel(gw, true), // Include namespace in label
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        data: {
          resource: gw,
          resourceKind: 'Gateway',
          status: getGatewayStatus(gw),
          listeners: gw.spec.listeners,
          namespace: gw.metadata?.namespace,
        },
      };

      nodes.push(node);

      // Edge: GatewayClass → Gateway (for proper hierarchy)
      const gcName = gw.spec.gatewayClassName;
      const gcId = getGatewayClassId({ metadata: { name: gcName } } as GatewayClass);

      // Only create edge if the GatewayClass exists in the model
      const gcExists = nodes.some((n) => n.id === gcId);
      if (gcExists) {
        const edge: EdgeModel = {
          id: `${gcId}_to_${gwId}`,
          type: TYPE_GATEWAY_TO_CLASS,
          source: gcId,
          target: gwId,
          edgeStyle: EdgeStyle.dashed,
        };

        edges.push(edge);
      }
    });
  }

  // 3. Create HTTPRoute nodes and edges to Gateways and Services
  if (resources.httpRoutes?.data) {
    resources.httpRoutes.data.forEach((route: HTTPRoute) => {
      const routeId = getHTTPRouteId(route);

      const node: NodeModel = {
        id: routeId,
        type: TYPE_HTTP_ROUTE,
        label: getResourceLabel(route, true), // Include namespace in label
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        data: {
          resource: route,
          resourceKind: 'HTTPRoute',
          status: getHTTPRouteStatus(route),
          rules: route.spec.rules,
          namespace: route.metadata?.namespace,
        },
      };

      nodes.push(node);

      // Edges: Gateway → HTTPRoute (for proper hierarchy)
      route.spec.parentRefs?.forEach((parentRef) => {
        if (parentRef.kind === 'Gateway' || !parentRef.kind) {
          const gwNamespace = parentRef.namespace || route.metadata?.namespace;
          const gwId = getGatewayId({
            metadata: {
              name: parentRef.name,
              namespace: gwNamespace,
            },
          } as Gateway);

          // Only create edge if the Gateway exists in the model
          const gwExists = nodes.some((n) => n.id === gwId);
          if (gwExists) {
            const edge: EdgeModel = {
              id: `${gwId}_to_${routeId}`,
              type: TYPE_ROUTE_TO_LISTENER,
              source: gwId,
              target: routeId,
              edgeStyle: EdgeStyle.solid,
            };

            edges.push(edge);
          }
        }
      });

      // Edges: HTTPRoute → Services (backendRefs)
      route.spec.rules?.forEach((rule, ruleIdx) => {
        rule.backendRefs?.forEach((backendRef, backendIdx) => {
          if (backendRef.kind === 'Service' || !backendRef.kind) {
            const svcNamespace = backendRef.namespace || route.metadata?.namespace;
            const svcId = getServiceId({
              metadata: {
                name: backendRef.name,
                namespace: svcNamespace,
              },
            } as Service);

            const edge: EdgeModel = {
              id: `${routeId}_rule${ruleIdx}_backend${backendIdx}_to_${svcId}`,
              type: TYPE_ROUTE_TO_SERVICE,
              source: routeId,
              target: svcId,
              edgeStyle: EdgeStyle.solid,
            };

            edges.push(edge);
          }
        });
      });
    });
  }

  // 4. Create Service nodes (only those referenced by HTTPRoutes)
  const referencedServiceIds = getReferencedServices(resources.httpRoutes?.data || []);
  if (resources.services?.data) {
    resources.services.data.forEach((svc: Service) => {
      const svcId = getServiceId(svc);
      if (referencedServiceIds.has(svcId)) {
        const node: NodeModel = {
          id: svcId,
          type: TYPE_SERVICE,
          label: getResourceLabel(svc, true), // Include namespace in label
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
          data: {
            resource: svc,
            resourceKind: 'Service',
            namespace: svc.metadata?.namespace,
          },
        };

        nodes.push(node);
      }
    });
  }

  return { nodes, edges };
};
