// Layout Factory for Gateway API Topology

import {
  Graph,
  Layout,
  LayoutFactory,
  DagreLayout,
  ColaLayout,
} from '@patternfly/react-topology';
import { LAYOUT_CONFIG } from '../../utils/gateway-constants';

export const LAYOUT_TYPE_DAGRE = 'Dagre';
export const LAYOUT_TYPE_COLA = 'Cola';

/**
 * Layout factory for Gateway API topology
 * Returns appropriate layout based on layout type
 */
export const layoutFactory: LayoutFactory = (type: string, graph: Graph): Layout | undefined => {
  switch (type) {
    case LAYOUT_TYPE_DAGRE:
      return new DagreLayout(graph, {
        rankdir: LAYOUT_CONFIG.DAGRE.rankdir,
        nodesep: LAYOUT_CONFIG.DAGRE.nodesep,
        ranksep: LAYOUT_CONFIG.DAGRE.ranksep,
        edgesep: LAYOUT_CONFIG.DAGRE.edgesep,
        marginx: LAYOUT_CONFIG.DAGRE.marginx,
        marginy: LAYOUT_CONFIG.DAGRE.marginy,
      });
    case LAYOUT_TYPE_COLA:
      return new ColaLayout(graph, {
        layoutOnDrag: LAYOUT_CONFIG.COLA.layoutOnDrag,
        maxTicks: LAYOUT_CONFIG.COLA.maxTicks,
      });
    default:
      return new DagreLayout(graph, {
        rankdir: LAYOUT_CONFIG.DAGRE.rankdir,
        nodesep: LAYOUT_CONFIG.DAGRE.nodesep,
        ranksep: LAYOUT_CONFIG.DAGRE.ranksep,
        edgesep: LAYOUT_CONFIG.DAGRE.edgesep,
        marginx: LAYOUT_CONFIG.DAGRE.marginx,
        marginy: LAYOUT_CONFIG.DAGRE.marginy,
      });
  }
};
