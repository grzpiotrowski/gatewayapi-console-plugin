// Component Factory for Gateway API Topology

import {
  ComponentFactory,
  GraphComponent,
  ModelKind,
  withPanZoom,
  withSelection,
} from '@patternfly/react-topology';
import {
  TYPE_GATEWAY_CLASS,
  TYPE_GATEWAY,
  TYPE_LISTENER,
  TYPE_HTTP_ROUTE,
  TYPE_SERVICE,
  TYPE_DNS_RECORD,
  TYPE_GATEWAY_TO_CLASS,
  TYPE_LISTENER_TO_GATEWAY,
  TYPE_ROUTE_TO_LISTENER,
  TYPE_ROUTE_TO_SERVICE,
  TYPE_GATEWAY_TO_DNS_RECORD,
} from '../../utils/gateway-constants';
import GatewayClassNode from './components/nodes/GatewayClassNode';
import GatewayNode from './components/nodes/GatewayNode';
import ListenerNode from './components/nodes/ListenerNode';
import HTTPRouteNode from './components/nodes/HTTPRouteNode';
import ServiceNode from './components/nodes/ServiceNode';
import DNSRecordNode from './components/nodes/DNSRecordNode';
import {
  GatewayToClassEdge,
  ListenerToGatewayEdge,
  RouteToListenerEdge,
  RouteToServiceEdge,
  DNSRecordEdge,
} from './components/edges/GatewayEdge';

/**
 * Component factory for Gateway API topology
 * Maps node and edge types to their React components
 */
export const componentFactory: ComponentFactory = (kind, type) => {
  switch (type) {
    // Node types - with controlled selection
    case TYPE_GATEWAY_CLASS:
      return withSelection({ controlled: true })(GatewayClassNode as any);

    case TYPE_GATEWAY:
      return withSelection({ controlled: true })(GatewayNode as any);

    case TYPE_LISTENER:
      return withSelection({ controlled: true })(ListenerNode as any);

    case TYPE_HTTP_ROUTE:
      return withSelection({ controlled: true })(HTTPRouteNode as any);

    case TYPE_SERVICE:
      return withSelection({ controlled: true })(ServiceNode as any);

    case TYPE_DNS_RECORD:
      return withSelection({ controlled: true })(DNSRecordNode as any);

    // Edge types - use custom colored edges with selection HOC
    case TYPE_GATEWAY_TO_CLASS:
      return withSelection()(GatewayToClassEdge as any);

    case TYPE_LISTENER_TO_GATEWAY:
      return withSelection()(ListenerToGatewayEdge as any);

    case TYPE_ROUTE_TO_LISTENER:
      return withSelection()(RouteToListenerEdge as any);

    case TYPE_ROUTE_TO_SERVICE:
      return withSelection()(RouteToServiceEdge as any);

    case TYPE_GATEWAY_TO_DNS_RECORD:
      return withSelection()(DNSRecordEdge as any);

    default:
      switch (kind) {
        case ModelKind.graph:
          return withPanZoom()(GraphComponent);
        default:
          return undefined;
      }
  }
};
