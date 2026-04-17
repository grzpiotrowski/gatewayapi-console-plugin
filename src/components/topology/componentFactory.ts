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

    // Edge types - use DefaultEdge with selection HOC
    case TYPE_GATEWAY_TO_CLASS:
    case TYPE_LISTENER_TO_GATEWAY:
    case TYPE_ROUTE_TO_LISTENER:
    case TYPE_ROUTE_TO_SERVICE:
    case TYPE_GATEWAY_TO_DNS_RECORD:
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
