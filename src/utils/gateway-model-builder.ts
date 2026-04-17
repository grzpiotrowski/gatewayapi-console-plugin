// Gateway API Topology Model Builder

import { Model, NodeModel, EdgeModel, EdgeStyle } from '@patternfly/react-topology';
import { Gateway, GatewayClass, HTTPRoute, Service, DNSRecord } from '../types/gateway-api';
import {
  TYPE_GATEWAY_CLASS,
  TYPE_GATEWAY,
  TYPE_LISTENER,
  TYPE_HTTP_ROUTE,
  TYPE_SERVICE,
  TYPE_DNS_RECORD,
  TYPE_GATEWAY_TO_CLASS,
  TYPE_LISTENER_TO_GATEWAY,
  TYPE_ROUTE_TO_LISTENER,
  TYPE_ROUTE_TO_SERVICE,
  TYPE_GATEWAY_TO_DNS_RECORD,
  NODE_WIDTH,
  NODE_HEIGHT,
  LISTENER_NODE_WIDTH,
  LISTENER_NODE_HEIGHT,
} from './gateway-constants';
import {
  getGatewayClassId,
  getGatewayId,
  getHTTPRouteId,
  getServiceId,
  getListenerId,
  getResourceLabel,
  getReferencedServices,
  isListenerHostnameCompatible,
  isListenerPrimary,
} from './gateway-utils';
import { getGatewayClassStatus, getGatewayStatus, getHTTPRouteStatus } from './gateway-status';

export interface GatewayAPIWatchedResources {
  gatewayClasses: {
    data: GatewayClass[];
    loaded: boolean;
    loadError?: any;
  };
  gateways: {
    data: Gateway[];
    loaded: boolean;
    loadError?: any;
  };
  httpRoutes?: {
    data: HTTPRoute[];
    loaded: boolean;
    loadError?: any;
  };
  services?: {
    data: Service[];
    loaded: boolean;
    loadError?: any;
  };
  dnsrecords?: {
    data: DNSRecord[];
    loaded: boolean;
    loadError?: any;
  };
}

/**
 * Build the Gateway API topology model from watched resources
 * Phase 3: GatewayClass, Gateway, Listener, HTTPRoute, and Service nodes
 */
export const buildGatewayTopologyModel = (resources: GatewayAPIWatchedResources): Model => {
  const nodes: NodeModel[] = [];
  const edges: EdgeModel[] = [];

  // 1. Create GatewayClass nodes (cluster-scoped)
  if (resources.gatewayClasses?.data) {
    resources.gatewayClasses.data.forEach((gc: GatewayClass) => {
      const gcId = getGatewayClassId(gc);

      const node: NodeModel = {
        id: gcId,
        type: TYPE_GATEWAY_CLASS,
        label: getResourceLabel(gc),
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        data: {
          resource: gc,
          resourceKind: 'GatewayClass',
          status: getGatewayClassStatus(gc),
        },
      };

      nodes.push(node);
    });
  }

  // 2. Create Gateway nodes and edges to GatewayClass
  if (resources.gateways?.data) {
    resources.gateways.data.forEach((gw: Gateway) => {
      const gwId = getGatewayId(gw);

      const node: NodeModel = {
        id: gwId,
        type: TYPE_GATEWAY,
        label: getResourceLabel(gw, true), // Include namespace in label
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        data: {
          resource: gw,
          resourceKind: 'Gateway',
          status: getGatewayStatus(gw),
          listeners: gw.spec.listeners,
          namespace: gw.metadata?.namespace,
        },
      };

      nodes.push(node);

      // Edge: GatewayClass → Gateway (for proper hierarchy)
      const gcName = gw.spec.gatewayClassName;
      const gcId = getGatewayClassId({ metadata: { name: gcName } } as GatewayClass);

      // Only create edge if the GatewayClass exists in the model
      const gcExists = nodes.some((n) => n.id === gcId);
      if (gcExists) {
        const edge: EdgeModel = {
          id: `${gcId}_to_${gwId}`,
          type: TYPE_GATEWAY_TO_CLASS,
          source: gcId,
          target: gwId,
          edgeStyle: EdgeStyle.dashed,
        };

        edges.push(edge);
      }

      // Create Listener nodes for each listener in the Gateway
      if (gw.spec.listeners && gw.spec.listeners.length > 0) {
        gw.spec.listeners.forEach((listener) => {
          const listenerId = getListenerId(gw, listener.name);

          const listenerNode: NodeModel = {
            id: listenerId,
            type: TYPE_LISTENER,
            label: listener.name,
            width: LISTENER_NODE_WIDTH,
            height: LISTENER_NODE_HEIGHT,
            data: {
              resource: listener,
              resourceKind: 'Listener',
              gatewayId: gwId,
              gatewayName: gw.metadata?.name,
              gatewayNamespace: gw.metadata?.namespace,
            },
          };

          nodes.push(listenerNode);

          // Edge: Gateway → Listener
          const listenerEdge: EdgeModel = {
            id: `${gwId}_to_${listenerId}`,
            type: TYPE_LISTENER_TO_GATEWAY,
            source: gwId,
            target: listenerId,
            edgeStyle: EdgeStyle.solid,
          };

          edges.push(listenerEdge);
        });
      }
    });
  }

  // 3. Create HTTPRoute nodes and edges to Listeners and Services
  if (resources.httpRoutes?.data) {
    resources.httpRoutes.data.forEach((route: HTTPRoute) => {
      const routeId = getHTTPRouteId(route);

      const node: NodeModel = {
        id: routeId,
        type: TYPE_HTTP_ROUTE,
        label: getResourceLabel(route, true), // Include namespace in label
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        data: {
          resource: route,
          resourceKind: 'HTTPRoute',
          status: getHTTPRouteStatus(route),
          rules: route.spec.rules,
          namespace: route.metadata?.namespace,
        },
      };

      nodes.push(node);

      // Edges: Listener → HTTPRoute (for proper hierarchy)
      route.spec.parentRefs?.forEach((parentRef) => {
        if (parentRef.kind === 'Gateway' || !parentRef.kind) {
          const gwNamespace = parentRef.namespace || route.metadata?.namespace;

          // Create a gateway reference for ID generation
          const gwRef = {
            metadata: {
              name: parentRef.name,
              namespace: gwNamespace,
            },
          } as Gateway;

          // If sectionName is specified, connect to specific Listener
          if (parentRef.sectionName) {
            const listenerId = getListenerId(gwRef, parentRef.sectionName);
            const listenerExists = nodes.some((n) => n.id === listenerId);

            if (listenerExists) {
              const edge: EdgeModel = {
                id: `${listenerId}_to_${routeId}`,
                type: TYPE_ROUTE_TO_LISTENER,
                source: listenerId,
                target: routeId,
                edgeStyle: EdgeStyle.solid,
              };

              edges.push(edge);
            } else {
              console.warn(
                `[GatewayModelBuilder] Listener not found: ${listenerId} for HTTPRoute ${routeId}`,
              );
            }
          } else {
            // Connect to all compatible listeners of the Gateway
            const gateway = resources.gateways?.data.find(
              (gw) =>
                gw.metadata?.name === parentRef.name && gw.metadata?.namespace === gwNamespace,
            );

            if (gateway?.spec.listeners) {
              // First pass: find all compatible listeners
              const compatibleListeners = gateway.spec.listeners.filter((listener) =>
                isListenerHostnameCompatible(listener.hostname, route.spec.hostnames),
              );

              // Second pass: create edges with appropriate style
              gateway.spec.listeners.forEach((listener) => {
                // Check if listener hostname is compatible with route hostnames
                const isCompatible = isListenerHostnameCompatible(
                  listener.hostname,
                  route.spec.hostnames,
                );

                if (!isCompatible) {
                  console.debug(
                    `[GatewayModelBuilder] Skipping listener ${listener.name} for HTTPRoute ${routeId}: hostname mismatch (listener: ${listener.hostname}, route: ${route.spec.hostnames?.join(', ')})`,
                  );
                  return;
                }

                const listenerId = getListenerId(gateway, listener.name);
                const listenerExists = nodes.some((n) => n.id === listenerId);

                if (listenerExists) {
                  // Determine if this listener is primary (handles actual traffic)
                  const isPrimary = isListenerPrimary(
                    listener,
                    compatibleListeners,
                    route.spec.hostnames,
                  );

                  const edge: EdgeModel = {
                    id: `${listenerId}_to_${routeId}_${listener.name}`,
                    type: TYPE_ROUTE_TO_LISTENER,
                    source: listenerId,
                    target: routeId,
                    // Solid line for primary (active), dashed for fallback
                    edgeStyle: isPrimary ? EdgeStyle.solid : EdgeStyle.dashed,
                  };

                  edges.push(edge);

                  console.debug(
                    `[GatewayModelBuilder] Connected listener ${listener.name} to HTTPRoute ${routeId}: ${isPrimary ? 'PRIMARY (solid)' : 'FALLBACK (dashed)'}`,
                  );
                } else {
                  console.warn(
                    `[GatewayModelBuilder] Listener not found: ${listenerId} for HTTPRoute ${routeId}`,
                  );
                }
              });
            } else {
              console.warn(
                `[GatewayModelBuilder] Gateway not found or has no listeners: ${parentRef.name} in namespace ${gwNamespace} for HTTPRoute ${routeId}`,
              );
            }
          }
        }
      });

      // Edges: HTTPRoute → Services (backendRefs)
      route.spec.rules?.forEach((rule, ruleIdx) => {
        rule.backendRefs?.forEach((backendRef, backendIdx) => {
          if (backendRef.kind === 'Service' || !backendRef.kind) {
            const svcNamespace = backendRef.namespace || route.metadata?.namespace;
            const svcId = getServiceId({
              metadata: {
                name: backendRef.name,
                namespace: svcNamespace,
              },
            } as Service);

            // Only create edge if the service node exists
            const serviceExists = nodes.some((n) => n.id === svcId);

            if (serviceExists) {
              const edge: EdgeModel = {
                id: `${routeId}_rule${ruleIdx}_backend${backendIdx}_to_${svcId}`,
                type: TYPE_ROUTE_TO_SERVICE,
                source: routeId,
                target: svcId,
                edgeStyle: EdgeStyle.solid,
              };

              edges.push(edge);
            } else {
              console.warn(
                `[GatewayModelBuilder] Service not found: ${svcId} for HTTPRoute ${routeId}`,
              );
            }
          }
        });
      });
    });
  }

  // 4. Create Service nodes (only those referenced by HTTPRoutes)
  const referencedServiceIds = getReferencedServices(resources.httpRoutes?.data || []);
  if (resources.services?.data) {
    resources.services.data.forEach((svc: Service) => {
      const svcId = getServiceId(svc);
      if (referencedServiceIds.has(svcId)) {
        const node: NodeModel = {
          id: svcId,
          type: TYPE_SERVICE,
          label: getResourceLabel(svc, true), // Include namespace in label
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
          data: {
            resource: svc,
            resourceKind: 'Service',
            namespace: svc.metadata?.namespace,
          },
        };

        nodes.push(node);
      }
    });
  }

  // 5. Create DNSRecord nodes and edges to Listeners (or Gateway as fallback)
  if (resources.dnsrecords?.data) {
    resources.dnsrecords.data.forEach((dnsRecord: DNSRecord) => {
      const dnsId = `dnsrecord-${dnsRecord.metadata?.namespace}-${dnsRecord.metadata?.name}`;

      const node: NodeModel = {
        id: dnsId,
        type: TYPE_DNS_RECORD,
        label: getResourceLabel(dnsRecord, true), // Include namespace in label
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        data: {
          resource: dnsRecord,
          resourceKind: 'DNSRecord',
          namespace: dnsRecord.metadata?.namespace,
        },
      };

      nodes.push(node);

      // Edge: DNSRecord connections (based on hostname match)
      const gatewayName = dnsRecord.metadata?.labels?.['gateway.networking.k8s.io/gateway-name'];
      const dnsName = dnsRecord.spec?.dnsName;

      if (gatewayName && dnsName) {
        // Find the Gateway
        const gateway = resources.gateways?.data.find(
          (gw) =>
            gw.metadata?.name === gatewayName &&
            gw.metadata?.namespace === dnsRecord.metadata?.namespace,
        );

        if (gateway) {
          const gwId = getGatewayId(gateway);
          const gwExists = nodes.some((n) => n.id === gwId);

          // Step 1: Always create edge from Gateway to DNSRecord (establishes DNSRecord at rank 2)
          if (gwExists) {
            const gatewayToDnsEdge: EdgeModel = {
              id: `${gwId}_to_${dnsId}`,
              type: TYPE_GATEWAY_TO_DNS_RECORD,
              source: gwId,
              target: dnsId,
              edgeStyle: EdgeStyle.dashed,
            };
            edges.push(gatewayToDnsEdge);

            console.log(
              `[GatewayModelBuilder] Created Gateway → DNSRecord edge for ${gatewayName} → ${dnsId}`,
            );
          }

          // Step 2: Try to match DNSRecord to specific Listener(s) by hostname
          if (gateway.spec.listeners) {
            // Normalize DNS name by removing trailing dot (FQDN notation)
            const normalizedDnsName = dnsName.endsWith('.') ? dnsName.slice(0, -1) : dnsName;

            console.log(
              `[GatewayModelBuilder] Matching DNSRecord ${dnsId} (dnsName: ${dnsName}, normalized: ${normalizedDnsName}) to listeners`,
            );

            gateway.spec.listeners.forEach((listener) => {
              const listenerHostname = listener.hostname;
              // Normalize listener hostname too (remove trailing dot if present)
              const normalizedListenerHostname = listenerHostname?.endsWith('.')
                ? listenerHostname.slice(0, -1)
                : listenerHostname;

              console.log(
                `[GatewayModelBuilder] Checking listener ${listener.name} (hostname: ${listenerHostname || 'undefined'}, normalized: ${normalizedListenerHostname || 'undefined'})`,
              );

              // Match logic:
              // 1. No hostname specified (undefined) - listener accepts all hostnames
              // 2. Exact match: listener.hostname === dnsRecord.spec.dnsName
              // 3. Wildcard listener: listener.hostname === '*' matches any DNS name
              // 4. Wildcard DNS: listener.hostname like '*.example.com' matches 'foo.example.com'
              const isMatch =
                !normalizedListenerHostname || // No hostname means accept all
                normalizedListenerHostname === normalizedDnsName ||
                normalizedListenerHostname === '*' ||
                (normalizedListenerHostname.startsWith('*.') &&
                  normalizedDnsName.endsWith(normalizedListenerHostname.substring(1)));

              console.log(`[GatewayModelBuilder] Match result: ${isMatch}`);

              if (isMatch) {
                const listenerId = getListenerId(gateway, listener.name);
                const listenerExists = nodes.some((n) => n.id === listenerId);

                if (listenerExists) {
                  // Step 3: Create edge from DNSRecord to matched Listener (shows specific connection)
                  const dnsToListenerEdge: EdgeModel = {
                    id: `${dnsId}_to_${listenerId}`,
                    type: TYPE_GATEWAY_TO_DNS_RECORD,
                    source: dnsId,
                    target: listenerId,
                    edgeStyle: EdgeStyle.solid,
                  };

                  edges.push(dnsToListenerEdge);

                  console.log(
                    `[GatewayModelBuilder] ✓ Created DNSRecord → Listener edge: ${dnsId} → ${listener.name} (hostname match: ${listenerHostname || '*'})`,
                  );
                } else {
                  console.warn(
                    `[GatewayModelBuilder] Listener ${listenerId} not found in nodes`,
                  );
                }
              }
            });
          }
        } else {
          console.warn(
            `[GatewayModelBuilder] Gateway ${gatewayName} has no listeners for DNSRecord ${dnsId}`,
          );
        }
      }
    });
  }

  return { nodes, edges };
};
