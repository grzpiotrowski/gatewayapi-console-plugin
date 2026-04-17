// HTTPRoute template for resource creation

export const httpRouteTemplate = {
  apiVersion: 'gateway.networking.k8s.io/v1',
  kind: 'HTTPRoute',
  metadata: {
    name: 'example-httproute',
    namespace: 'default',
  },
  spec: {
    parentRefs: [
      {
        name: 'example-gateway',
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
