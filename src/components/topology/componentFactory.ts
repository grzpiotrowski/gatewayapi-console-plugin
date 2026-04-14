// Component Factory for Gateway API Topology

import {
  ComponentFactory,
  GraphComponent,
  ModelKind,
  withPanZoom,
} from '@patternfly/react-topology';
import { TYPE_GATEWAY_CLASS, TYPE_GATEWAY, TYPE_GATEWAY_TO_CLASS } from '../../utils/gateway-constants';
import GatewayClassNode from './components/nodes/GatewayClassNode';
import GatewayNode from './components/nodes/GatewayNode';
import GatewayEdge from './components/edges/GatewayEdge';

/**
 * Component factory for Gateway API topology
 * Maps node and edge types to their React components
 */
export const componentFactory: ComponentFactory = (kind, type) => {
  switch (type) {
    case TYPE_GATEWAY_CLASS:
      return GatewayClassNode;

    case TYPE_GATEWAY:
      return GatewayNode;

    case TYPE_GATEWAY_TO_CLASS:
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
