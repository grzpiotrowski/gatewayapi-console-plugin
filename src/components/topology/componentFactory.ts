// Component Factory for Gateway API Topology

import {
  ComponentFactory,
  GraphComponent,
  ModelKind,
  withPanZoom,
  withSelection,
  DefaultEdge,
} from '@patternfly/react-topology';
import {
  TYPE_GATEWAY_CLASS,
  TYPE_GATEWAY,
  TYPE_LISTENER,
  TYPE_HTTP_ROUTE,
  TYPE_SERVICE,
  TYPE_GATEWAY_TO_CLASS,
  TYPE_LISTENER_TO_GATEWAY,
  TYPE_ROUTE_TO_LISTENER,
  TYPE_ROUTE_TO_SERVICE,
} from '../../utils/gateway-constants';
import GatewayClassNode from './components/nodes/GatewayClassNode';
import GatewayNode from './components/nodes/GatewayNode';
import ListenerNode from './components/nodes/ListenerNode';
import HTTPRouteNode from './components/nodes/HTTPRouteNode';
import ServiceNode from './components/nodes/ServiceNode';

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

    case TYPE_LISTENER:
      return ListenerNode;

    case TYPE_HTTP_ROUTE:
      return HTTPRouteNode;

    case TYPE_SERVICE:
      return ServiceNode;

    // Edge types - use DefaultEdge with selection HOC
    case TYPE_GATEWAY_TO_CLASS:
    case TYPE_LISTENER_TO_GATEWAY:
    case TYPE_ROUTE_TO_LISTENER:
    case TYPE_ROUTE_TO_SERVICE:
      return withSelection()(DefaultEdge);

    default:
      switch (kind) {
        case ModelKind.graph:
          return withPanZoom()(GraphComponent);
        default:
          return undefined;
      }
  }
};
