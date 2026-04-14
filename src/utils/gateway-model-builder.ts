// Gateway API Topology Model Builder

import { Model, NodeModel, EdgeModel, EdgeStyle } from '@patternfly/react-topology';
import { Gateway, GatewayClass, HTTPRoute, Service } from '../types/gateway-api';
import {
  TYPE_GATEWAY_CLASS,
  TYPE_GATEWAY,
  TYPE_GATEWAY_TO_CLASS,
  NODE_WIDTH,
  NODE_HEIGHT,
} from './gateway-constants';
import { getGatewayClassId, getGatewayId, getResourceLabel } from './gateway-utils';
import { getGatewayClassStatus, getGatewayStatus } from './gateway-status';

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
 * Phase 1: Only GatewayClass and Gateway nodes
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
        label: getResourceLabel(gw),
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        data: {
          resource: gw,
          resourceKind: 'Gateway',
          status: getGatewayStatus(gw),
          listeners: gw.spec.listeners,
        },
      };

      nodes.push(node);

      // Edge: Gateway → GatewayClass
      const gcName = gw.spec.gatewayClassName;
      const gcId = getGatewayClassId({ metadata: { name: gcName } } as GatewayClass);

      // Only create edge if the GatewayClass exists in the model
      const gcExists = nodes.some((n) => n.id === gcId);
      if (gcExists) {
        const edge: EdgeModel = {
          id: `${gwId}_to_${gcId}`,
          type: TYPE_GATEWAY_TO_CLASS,
          source: gwId,
          target: gcId,
          edgeStyle: EdgeStyle.dashed,
        };

        edges.push(edge);
      }
    });
  }

  return { nodes, edges };
};
