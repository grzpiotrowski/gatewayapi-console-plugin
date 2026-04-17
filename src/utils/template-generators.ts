// Context-aware template generators for creating resources from parent context

import { Gateway, GatewayClass, HTTPRoute } from '../types/gateway-api';

/**
 * Generate a Gateway template pre-filled with GatewayClass reference
 */
export const createGatewayTemplateForClass = (
  gatewayClass: GatewayClass,
  namespace: string = 'default',
) => {
  return {
    apiVersion: 'gateway.networking.k8s.io/v1',
    kind: 'Gateway',
    metadata: {
      name: `${gatewayClass.metadata?.name || 'example'}-gateway`,
      namespace,
    },
    spec: {
      gatewayClassName: gatewayClass.metadata?.name || '',
      listeners: [
        {
          name: 'http',
          protocol: 'HTTP',
          port: 80,
        },
      ],
    },
  };
};

/**
 * Generate an HTTPRoute template pre-filled with Gateway parentRef
 */
export const createHTTPRouteTemplateForGateway = (gateway: Gateway) => {
  const namespace = gateway.metadata?.namespace || 'default';
  const gatewayName = gateway.metadata?.name || '';

  return {
    apiVersion: 'gateway.networking.k8s.io/v1',
    kind: 'HTTPRoute',
    metadata: {
      name: `${gatewayName}-route`,
      namespace,
    },
    spec: {
      parentRefs: [
        {
          name: gatewayName,
          namespace,
        },
      ],
      rules: [
        {
          matches: [
            {
              path: {
                type: 'PathPrefix',
                value: '/',
              },
            },
          ],
          backendRefs: [
            {
              name: 'example-service',
              port: 80,
            },
          ],
        },
      ],
    },
  };
};

/**
 * Generate a Service template with labels matching HTTPRoute selector
 */
export const createServiceTemplateForHTTPRoute = (
  httpRoute: HTTPRoute,
  namespace?: string,
) => {
  const ns = namespace || httpRoute.metadata?.namespace || 'default';
  const routeName = httpRoute.metadata?.name || '';

  return {
    apiVersion: 'v1',
    kind: 'Service',
    metadata: {
      name: `${routeName}-service`,
      namespace: ns,
      labels: {
        app: routeName,
      },
    },
    spec: {
      selector: {
        app: routeName,
      },
      ports: [
        {
          protocol: 'TCP',
          port: 80,
          targetPort: 8080,
        },
      ],
      type: 'ClusterIP',
    },
  };
};
