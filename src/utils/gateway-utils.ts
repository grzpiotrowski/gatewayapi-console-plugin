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
 */
export const getListenerId = (
  gateway: Pick<Gateway, 'metadata'>,
  listenerIndex: number,
): string => {
  return `${getGatewayId(gateway)}_listener_${listenerIndex}`;
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
