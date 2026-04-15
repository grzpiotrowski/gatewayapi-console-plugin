// Gateway API v1 TypeScript Types
// Based on: https://gateway-api.sigs.k8s.io/

import { K8sResourceCommon, ObjectReference } from '@openshift-console/dynamic-plugin-sdk';

// Common Types

export interface Condition {
  type: string;
  status: 'True' | 'False' | 'Unknown';
  observedGeneration?: number;
  lastTransitionTime: string;
  reason: string;
  message: string;
}

export interface ParentReference {
  group?: string;
  kind?: string;
  namespace?: string;
  name: string;
  sectionName?: string;
  port?: number;
}

// GatewayClass Types

export interface GatewayClass extends K8sResourceCommon {
  apiVersion: 'gateway.networking.k8s.io/v1';
  kind: 'GatewayClass';
  spec: {
    controllerName: string;
    parametersRef?: ObjectReference;
    description?: string;
  };
  status?: {
    conditions?: Condition[];
  };
}

// Gateway Types

export interface GatewayAddress {
  type?: 'IPAddress' | 'Hostname' | 'NamedAddress';
  value: string;
}

export interface GatewayTLSConfig {
  mode?: 'Terminate' | 'Passthrough';
  certificateRefs?: ObjectReference[];
  options?: Record<string, string>;
}

export interface AllowedRoutes {
  namespaces?: {
    from?: 'All' | 'Same' | 'Selector';
    selector?: any;
  };
  kinds?: Array<{
    group?: string;
    kind: string;
  }>;
}

export interface Listener {
  name: string;
  hostname?: string;
  port: number;
  protocol: 'HTTP' | 'HTTPS' | 'TCP' | 'TLS' | 'UDP';
  tls?: GatewayTLSConfig;
  allowedRoutes?: AllowedRoutes;
}

export interface ListenerStatus {
  name: string;
  supportedKinds: Array<{
    group?: string;
    kind: string;
  }>;
  attachedRoutes: number;
  conditions: Condition[];
}

export interface Gateway extends K8sResourceCommon {
  apiVersion: 'gateway.networking.k8s.io/v1';
  kind: 'Gateway';
  spec: {
    gatewayClassName: string;
    listeners: Listener[];
    addresses?: GatewayAddress[];
  };
  status?: {
    conditions?: Condition[];
    addresses?: GatewayAddress[];
    listeners?: ListenerStatus[];
  };
}

// HTTPRoute Types

export interface HTTPPathMatch {
  type?: 'Exact' | 'PathPrefix' | 'RegularExpression';
  value: string;
}

export interface HTTPHeaderMatch {
  type?: 'Exact' | 'RegularExpression';
  name: string;
  value: string;
}

export interface HTTPQueryParamMatch {
  type?: 'Exact' | 'RegularExpression';
  name: string;
  value: string;
}

export interface HTTPRouteMatch {
  path?: HTTPPathMatch;
  headers?: HTTPHeaderMatch[];
  queryParams?: HTTPQueryParamMatch[];
  method?: string;
}

export interface HTTPRequestHeaderFilter {
  set?: Array<{ name: string; value: string }>;
  add?: Array<{ name: string; value: string }>;
  remove?: string[];
}

export interface HTTPRequestRedirectFilter {
  scheme?: string;
  hostname?: string;
  path?: {
    type: 'ReplaceFullPath' | 'ReplacePrefixMatch';
    replaceFullPath?: string;
    replacePrefixMatch?: string;
  };
  port?: number;
  statusCode?: number;
}

export interface HTTPURLRewriteFilter {
  hostname?: string;
  path?: {
    type: 'ReplaceFullPath' | 'ReplacePrefixMatch';
    replaceFullPath?: string;
    replacePrefixMatch?: string;
  };
}

export interface HTTPRouteFilter {
  type:
    | 'RequestHeaderModifier'
    | 'ResponseHeaderModifier'
    | 'RequestRedirect'
    | 'URLRewrite'
    | 'ExtensionRef';
  requestHeaderModifier?: HTTPRequestHeaderFilter;
  responseHeaderModifier?: HTTPRequestHeaderFilter;
  requestRedirect?: HTTPRequestRedirectFilter;
  urlRewrite?: HTTPURLRewriteFilter;
  extensionRef?: ObjectReference;
}

export interface HTTPBackendRef {
  name: string;
  namespace?: string;
  port?: number;
  kind?: string;
  group?: string;
  weight?: number;
  filters?: HTTPRouteFilter[];
}

export interface HTTPRouteRule {
  matches?: HTTPRouteMatch[];
  filters?: HTTPRouteFilter[];
  backendRefs?: HTTPBackendRef[];
}

export interface RouteParentStatus {
  parentRef: ParentReference;
  controllerName: string;
  conditions: Condition[];
}

export interface HTTPRoute extends K8sResourceCommon {
  apiVersion: 'gateway.networking.k8s.io/v1';
  kind: 'HTTPRoute';
  spec: {
    parentRefs?: ParentReference[];
    hostnames?: string[];
    rules?: HTTPRouteRule[];
  };
  status?: {
    parents?: RouteParentStatus[];
  };
}

// Service Type (from core/v1)

export interface ServicePort {
  name?: string;
  protocol?: 'TCP' | 'UDP' | 'SCTP';
  port: number;
  targetPort?: number | string;
  nodePort?: number;
}

export interface Service extends K8sResourceCommon {
  apiVersion: 'v1';
  kind: 'Service';
  spec: {
    type?: 'ClusterIP' | 'NodePort' | 'LoadBalancer' | 'ExternalName';
    selector?: Record<string, string>;
    ports?: ServicePort[];
    clusterIP?: string;
    externalIPs?: string[];
    loadBalancerIP?: string;
  };
  status?: {
    loadBalancer?: {
      ingress?: Array<{
        ip?: string;
        hostname?: string;
      }>;
    };
  };
}
