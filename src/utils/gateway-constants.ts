// Gateway API Topology Constants

// Node type constants
export const TYPE_GATEWAY_CLASS = 'gateway-class';
export const TYPE_GATEWAY = 'gateway';
export const TYPE_HTTP_ROUTE = 'http-route';
export const TYPE_LISTENER = 'listener';
export const TYPE_SERVICE = 'service';
export const TYPE_DNS_RECORD = 'dns-record';

// Edge type constants
export const TYPE_GATEWAY_TO_CLASS = 'gateway-to-class';
export const TYPE_LISTENER_TO_GATEWAY = 'listener-to-gateway';
export const TYPE_ROUTE_TO_LISTENER = 'route-to-listener';
export const TYPE_ROUTE_TO_SERVICE = 'route-to-service';
export const TYPE_GATEWAY_TO_DNS_RECORD = 'gateway-to-dns-record';

// Node dimensions (in pixels)
export const NODE_WIDTH = 104;
export const NODE_HEIGHT = 104;
export const LISTENER_NODE_WIDTH = 78;
export const LISTENER_NODE_HEIGHT = 78;

// Node padding
export const NODE_PADDING = [0, 20];

// Layout configuration
export const LAYOUT_CONFIG = {
  DAGRE: {
    rankdir: 'TB', // Top to bottom
    nodesep: 150, // Increased horizontal spacing between nodes at same rank
    ranksep: 120, // Increased vertical spacing between ranks
    edgesep: 50,
    marginx: 50,
    marginy: 50,
  },
  COLA: {
    layoutOnDrag: false,
    maxTicks: 300,
  },
};

// Gateway API resource identifiers
export const GATEWAY_API_GROUP = 'gateway.networking.k8s.io';
export const GATEWAY_API_VERSION = 'v1';

// CSS class prefixes (must match plugin name to avoid conflicts)
export const CSS_PREFIX = 'gatewayapi-console-plugin';

// Status condition types
export const CONDITION_TYPE_ACCEPTED = 'Accepted';
export const CONDITION_TYPE_PROGRAMMED = 'Programmed';
export const CONDITION_TYPE_READY = 'Ready';

// Z-index layers
export const DEFAULT_LAYER = 'default';
export const TOP_LAYER = 'top';
