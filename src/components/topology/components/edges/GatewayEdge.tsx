// Gateway Edge Component

import * as React from 'react';
import {
  Edge,
  observer,
  EdgeTerminalType,
  DefaultEdge,
  GraphElement,
} from '@patternfly/react-topology';
import { CSS_PREFIX } from '../../../../utils/gateway-constants';

import './GatewayEdge.css';

interface GatewayEdgeProps {
  element: GraphElement;
}

const GatewayEdge: React.FC<GatewayEdgeProps> = ({ element }) => {
  return (
    <DefaultEdge
      element={element as Edge}
      className={`${CSS_PREFIX}__edge`}
      endTerminalType={EdgeTerminalType.directional}
    />
  );
};

export default observer(GatewayEdge);
