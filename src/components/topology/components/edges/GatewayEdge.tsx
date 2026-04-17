// Gateway Edge Components - different colors for different connection types

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

interface EdgeProps {
  element: GraphElement;
}

interface ColoredEdgeProps extends EdgeProps {
  color: string;
  className: string;
}

const ColoredEdge: React.FC<ColoredEdgeProps> = observer(({ element, color, className }) => {
  const edgeRef = React.useRef<SVGGElement>(null);

  React.useEffect(() => {
    console.log('[ColoredEdge] useEffect running, edgeRef.current:', edgeRef.current);

    if (edgeRef.current) {
      // Find the path and arrow elements and apply color
      const pathElement = edgeRef.current.querySelector('.pf-topology__edge__link');
      const arrowElement = edgeRef.current.querySelector('.pf-topology-connector-arrow polygon');

      console.log('[ColoredEdge] Found elements:', { pathElement, arrowElement, color });

      if (pathElement) {
        // Use style.setProperty with 'important' priority to override CSS
        (pathElement as SVGPathElement).style.setProperty('stroke', color, 'important');
        (pathElement as SVGPathElement).style.setProperty('stroke-width', '2', 'important');
        console.log('[ColoredEdge] Set stroke color via setProperty with !important:', color);
      }
      if (arrowElement) {
        (arrowElement as SVGPolygonElement).style.setProperty('fill', color, 'important');
        console.log('[ColoredEdge] Set arrow color via setProperty with !important:', color);
      }
    }
  });

  return (
    <g ref={edgeRef}>
      <DefaultEdge
        element={element as Edge}
        className={`${CSS_PREFIX}__edge ${className}`}
        endTerminalType={EdgeTerminalType.directional}
      />
    </g>
  );
});

// GatewayClass → Gateway edge (blue, dashed)
export const GatewayToClassEdge: React.FC<EdgeProps> = observer(({ element }) => {
  return (
    <ColoredEdge
      element={element}
      color="#06c"
      className={`${CSS_PREFIX}__edge--gateway-to-class`}
    />
  );
});

// Gateway → Listener edge (cyan)
export const ListenerToGatewayEdge: React.FC<EdgeProps> = observer(({ element }) => {
  return (
    <ColoredEdge
      element={element}
      color="#009596"
      className={`${CSS_PREFIX}__edge--listener-to-gateway`}
    />
  );
});

// Listener → HTTPRoute edge (green, can be dashed for fallback)
export const RouteToListenerEdge: React.FC<EdgeProps> = observer(({ element }) => {
  return (
    <ColoredEdge
      element={element}
      color="#3e8635"
      className={`${CSS_PREFIX}__edge--route-to-listener`}
    />
  );
});

// HTTPRoute → Service edge (orange)
export const RouteToServiceEdge: React.FC<EdgeProps> = observer(({ element }) => {
  return (
    <ColoredEdge
      element={element}
      color="#ec7a08"
      className={`${CSS_PREFIX}__edge--route-to-service`}
    />
  );
});

// Gateway/DNSRecord edges (purple, can be dashed)
export const DNSRecordEdge: React.FC<EdgeProps> = observer(({ element }) => {
  return (
    <ColoredEdge
      element={element}
      color="#8476d1"
      className={`${CSS_PREFIX}__edge--dns-record`}
    />
  );
});
