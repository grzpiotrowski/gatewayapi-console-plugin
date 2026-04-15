// Gateway API Utility Functions

import { Gateway, GatewayClass, HTTPRoute, Service } from '../types/gateway-api';

/**
 * Generate a unique ID for a GatewayClass node
 */
export const getGatewayClassId = (gatewayClass: Pick<GatewayClass, 'metadata'>): string => {
  return `gatewayclass:${gatewayClass.metadata?.name}`;
};

/**
 * Generate a unique ID for a Gateway node
 */
export const getGatewayId = (gateway: Pick<Gateway, 'metadata'>): string => {
  return `gateway:${gateway.metadata?.namespace}/${gateway.metadata?.name}`;
};

/**
 * Generate a unique ID for an HTTPRoute node
 */
export const getHTTPRouteId = (httpRoute: Pick<HTTPRoute, 'metadata'>): string => {
  return `httproute:${httpRoute.metadata?.namespace}/${httpRoute.metadata?.name}`;
};

/**
 * Generate a unique ID for a Service node
 */
export const getServiceId = (service: Pick<Service, 'metadata'>): string => {
  return `service:${service.metadata?.namespace}/${service.metadata?.name}`;
};

/**
 * Generate a unique ID for a Listener (derived from Gateway)
 * @param gateway - The Gateway resource
 * @param listenerName - The name of the listener (from listener.name)
 */
export const getListenerId = (gateway: Pick<Gateway, 'metadata'>, listenerName: string): string => {
  return `${getGatewayId(gateway)}_listener_${listenerName}`;
};

/**
 * Get all services referenced by HTTPRoutes
 */
export const getReferencedServices = (httpRoutes: HTTPRoute[]): Set<string> => {
  const serviceIds = new Set<string>();

  httpRoutes.forEach((route) => {
    route.spec.rules?.forEach((rule) => {
      rule.backendRefs?.forEach((backendRef) => {
        // Only include Service kind (default if not specified)
        if (backendRef.kind === 'Service' || !backendRef.kind) {
          const svcNamespace = backendRef.namespace || route.metadata?.namespace;
          const svcId = getServiceId({
            metadata: {
              name: backendRef.name,
              namespace: svcNamespace,
            },
          });
          serviceIds.add(svcId);
        }
      });
    });
  });

  return serviceIds;
};

/**
 * Check if a resource has the given condition with status True
 */
export const hasCondition = (
  conditions: Array<{ type: string; status: string }> | undefined,
  conditionType: string,
): boolean => {
  if (!conditions) return false;
  const condition = conditions.find((c) => c.type === conditionType);
  return condition?.status === 'True';
};

/**
 * Get human-readable label for a resource
 */
export const getResourceLabel = (
  resource: { metadata?: { name?: string; namespace?: string } },
  includeNamespace = false,
): string => {
  const name = resource.metadata?.name || 'Unknown';
  if (includeNamespace && resource.metadata?.namespace) {
    return `${name}\n(${resource.metadata.namespace})`;
  }
  return name;
};

/**
 * Check if a listener hostname matches an HTTPRoute hostname
 * Implements Gateway API hostname matching semantics
 *
 * Rules:
 * 1. If listener has no hostname, it matches all route hostnames
 * 2. If route has no hostnames, it matches all listener hostnames
 * 3. Exact match: listener.hostname === route.hostname
 * 4. Wildcard match: listener has wildcard and route hostname matches pattern
 * 5. Route wildcard: route has wildcard and listener hostname matches pattern
 *
 * @param listenerHostname - Hostname from listener (e.g., "*.example.com" or "api.example.com")
 * @param routeHostnames - Hostnames from HTTPRoute spec
 * @returns true if listener and route are compatible
 */
export const isListenerHostnameCompatible = (
  listenerHostname: string | undefined,
  routeHostnames: string[] | undefined,
): boolean => {
  // Rule 1: Listener with no hostname matches all routes
  if (!listenerHostname) {
    return true;
  }

  // Rule 2: Route with no hostnames matches all listeners
  if (!routeHostnames || routeHostnames.length === 0) {
    return true;
  }

  // Check if any route hostname is compatible with the listener hostname
  return routeHostnames.some((routeHostname) => {
    // Rule 3: Exact match
    if (listenerHostname === routeHostname) {
      return true;
    }

    // Rule 4: Listener has wildcard (e.g., "*.example.com")
    if (listenerHostname.startsWith('*.')) {
      const listenerDomain = listenerHostname.substring(2); // Remove "*."
      // Route hostname must end with the listener domain
      // e.g., "api.example.com" matches "*.example.com"
      return routeHostname.endsWith(`.${listenerDomain}`) || routeHostname === listenerDomain;
    }

    // Rule 5: Route has wildcard (e.g., "*.example.com")
    if (routeHostname.startsWith('*.')) {
      const routeDomain = routeHostname.substring(2); // Remove "*."
      // Listener hostname must end with the route domain
      return listenerHostname.endsWith(`.${routeDomain}`) || listenerHostname === routeDomain;
    }

    return false;
  });
};

/**
 * Calculate listener hostname specificity for precedence ordering
 * Higher score = more specific = higher precedence
 *
 * Specificity levels:
 * 1. Exact hostname match (e.g., "api.example.com"): score = 3
 * 2. Wildcard hostname (e.g., "*.example.com"): score = 2
 * 3. No hostname (accepts all): score = 1
 *
 * @param listenerHostname - Hostname from listener
 * @param routeHostnames - Hostnames from HTTPRoute spec
 * @returns Specificity score (higher = more specific)
 */
export const getListenerSpecificity = (
  listenerHostname: string | undefined,
  routeHostnames: string[] | undefined,
): number => {
  // No hostname = lowest specificity (catch-all)
  if (!listenerHostname) {
    return 1;
  }

  // Check if this is an exact match with any route hostname
  if (routeHostnames && routeHostnames.length > 0) {
    const hasExactMatch = routeHostnames.some((routeHostname) => {
      return listenerHostname === routeHostname;
    });
    if (hasExactMatch) {
      return 3; // Exact match = highest specificity
    }
  }

  // Wildcard hostname = medium specificity
  if (listenerHostname.startsWith('*.')) {
    return 2;
  }

  // Specific hostname (but not matching any route hostname) = high specificity
  return 3;
};

/**
 * Determine if a listener is the primary (highest precedence) listener for a route
 * when multiple listeners match the same route.
 *
 * Precedence rules (Gateway API spec):
 * 1. More specific hostname wins (exact > wildcard > no hostname)
 * 2. If same specificity, all are considered equal (implementation-dependent)
 *
 * @param listener - The listener to check
 * @param allMatchingListeners - All listeners that match the route
 * @param routeHostnames - Hostnames from HTTPRoute spec
 * @returns true if this listener has the highest precedence
 */
export const isListenerPrimary = (
  listener: { hostname?: string },
  allMatchingListeners: Array<{ hostname?: string }>,
  routeHostnames: string[] | undefined,
): boolean => {
  const currentSpecificity = getListenerSpecificity(listener.hostname, routeHostnames);

  // Check if any other listener has higher specificity
  const hasHigherSpecificity = allMatchingListeners.some((otherListener) => {
    const otherSpecificity = getListenerSpecificity(otherListener.hostname, routeHostnames);
    return otherSpecificity > currentSpecificity;
  });

  return !hasHigherSpecificity;
};
