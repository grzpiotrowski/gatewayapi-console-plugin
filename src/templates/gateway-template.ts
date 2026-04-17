// Gateway template for resource creation

export const gatewayTemplate = {
  apiVersion: 'gateway.networking.k8s.io/v1',
  kind: 'Gateway',
  metadata: {
    name: 'example-gateway',
    namespace: 'default',
  },
  spec: {
    gatewayClassName: 'example-gatewayclass',
    listeners: [
      {
        name: 'http',
        protocol: 'HTTP',
        port: 80,
      },
    ],
  },
};
