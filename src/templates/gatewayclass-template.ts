// GatewayClass template for resource creation

export const gatewayClassTemplate = {
  apiVersion: 'gateway.networking.k8s.io/v1',
  kind: 'GatewayClass',
  metadata: {
    name: 'example-gatewayclass',
  },
  spec: {
    controllerName: 'example.com/gateway-controller',
    description: 'Example GatewayClass',
  },
};
