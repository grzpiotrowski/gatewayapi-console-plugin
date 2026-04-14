// Gateway API Status Utilities

import { NodeStatus } from '@patternfly/react-topology';
import { Gateway, GatewayClass, HTTPRoute } from '../types/gateway-api';
import { CONDITION_TYPE_ACCEPTED, CONDITION_TYPE_PROGRAMMED } from './gateway-constants';

/**
 * Get the status for a GatewayClass based on its conditions
 */
export const getGatewayClassStatus = (gatewayClass: GatewayClass): NodeStatus => {
  const conditions = gatewayClass.status?.conditions;
  if (!conditions || conditions.length === 0) {
    return NodeStatus.default;
  }

  const acceptedCondition = conditions.find((c) => c.type === CONDITION_TYPE_ACCEPTED);

  if (acceptedCondition?.status === 'True') {
    return NodeStatus.success;
  }

  if (acceptedCondition?.status === 'False') {
    return NodeStatus.danger;
  }

  return NodeStatus.warning;
};

/**
 * Get the status for a Gateway based on its conditions
 */
export const getGatewayStatus = (gateway: Gateway): NodeStatus => {
  const conditions = gateway.status?.conditions;
  if (!conditions || conditions.length === 0) {
    return NodeStatus.default;
  }

  // Check both Accepted and Programmed conditions
  const acceptedCondition = conditions.find((c) => c.type === CONDITION_TYPE_ACCEPTED);
  const programmedCondition = conditions.find((c) => c.type === CONDITION_TYPE_PROGRAMMED);

  // If either is False, show danger
  if (acceptedCondition?.status === 'False' || programmedCondition?.status === 'False') {
    return NodeStatus.danger;
  }

  // If both are True, show success
  if (acceptedCondition?.status === 'True' && programmedCondition?.status === 'True') {
    return NodeStatus.success;
  }

  // If at least one is True, show warning
  if (acceptedCondition?.status === 'True' || programmedCondition?.status === 'True') {
    return NodeStatus.warning;
  }

  return NodeStatus.default;
};

/**
 * Get the status for an HTTPRoute based on its parent status
 */
export const getHTTPRouteStatus = (httpRoute: HTTPRoute): NodeStatus => {
  const parents = httpRoute.status?.parents;
  if (!parents || parents.length === 0) {
    return NodeStatus.default;
  }

  // Check if all parents have Accepted condition as True
  const allAccepted = parents.every((parent) => {
    const acceptedCondition = parent.conditions?.find((c) => c.type === CONDITION_TYPE_ACCEPTED);
    return acceptedCondition?.status === 'True';
  });

  // Check if any parent has Accepted condition as False
  const anyRejected = parents.some((parent) => {
    const acceptedCondition = parent.conditions?.find((c) => c.type === CONDITION_TYPE_ACCEPTED);
    return acceptedCondition?.status === 'False';
  });

  if (anyRejected) {
    return NodeStatus.danger;
  }

  if (allAccepted) {
    return NodeStatus.success;
  }

  return NodeStatus.warning;
};

/**
 * Get a human-readable status message for a Gateway
 */
export const getGatewayStatusMessage = (gateway: Gateway): string => {
  const conditions = gateway.status?.conditions;
  if (!conditions || conditions.length === 0) {
    return 'Unknown';
  }

  const acceptedCondition = conditions.find((c) => c.type === CONDITION_TYPE_ACCEPTED);
  const programmedCondition = conditions.find((c) => c.type === CONDITION_TYPE_PROGRAMMED);

  if (acceptedCondition?.status === 'True' && programmedCondition?.status === 'True') {
    return 'Ready';
  }

  if (acceptedCondition?.status === 'False') {
    return acceptedCondition.message || 'Not Accepted';
  }

  if (programmedCondition?.status === 'False') {
    return programmedCondition.message || 'Not Programmed';
  }

  return 'Pending';
};
