// Component Factory for Gateway API Topology

import {
  ComponentFactory,
  GraphComponent,
  ModelKind,
  withPanZoom,
} from '@patternfly/react-topology';
import {
  TYPE_GATEWAY_CLASS,
  TYPE_GATEWAY,
  TYPE_HTTP_ROUTE,
  TYPE_SERVICE,
  TYPE_GATEWAY_TO_CLASS,
  TYPE_ROUTE_TO_LISTENER,
  TYPE_ROUTE_TO_SERVICE,
} from '../../utils/gateway-constants';
import GatewayClassNode from './components/nodes/GatewayClassNode';
import GatewayNode from './components/nodes/GatewayNode';
import HTTPRouteNode from './components/nodes/HTTPRouteNode';
import ServiceNode from './components/nodes/ServiceNode';
import GatewayEdge from './components/edges/GatewayEdge';

/**
 * Component factory for Gateway API topology
 * Maps node and edge types to their React components
 */
export const componentFactory: ComponentFactory = (kind, type) => {
  switch (type) {
    // Node types
    case TYPE_GATEWAY_CLASS:
      return GatewayClassNode;

    case TYPE_GATEWAY:
      return GatewayNode;

    case TYPE_HTTP_ROUTE:
      return HTTPRouteNode;

    case TYPE_SERVICE:
      return ServiceNode;

    // Edge types
    case TYPE_GATEWAY_TO_CLASS:
    case TYPE_ROUTE_TO_LISTENER:
    case TYPE_ROUTE_TO_SERVICE:
      return GatewayEdge;

    default:
      switch (kind) {
        case ModelKind.graph:
          return withPanZoom()(GraphComponent);
        default:
          return undefined;
      }
  }
};
