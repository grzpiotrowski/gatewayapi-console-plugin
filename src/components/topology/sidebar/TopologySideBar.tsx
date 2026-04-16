// Topology SideBar Component

import * as React from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerContentBody,
  DrawerPanelContent,
  DrawerHead,
  DrawerActions,
  DrawerCloseButton,
  DrawerPanelBody,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { GraphElement } from '@patternfly/react-topology';
import { GatewayClassDetails } from './GatewayClassDetails';
import { GatewayDetails } from './GatewayDetails';
import { HTTPRouteDetails } from './HTTPRouteDetails';
import { ServiceDetails } from './ServiceDetails';
import { ListenerDetails } from './ListenerDetails';
import { GatewayClass, Gateway, HTTPRoute, Service } from '../../../types/gateway-api';
import {
  TYPE_GATEWAY_CLASS,
  TYPE_GATEWAY,
  TYPE_HTTP_ROUTE,
  TYPE_SERVICE,
  TYPE_LISTENER,
} from '../../../utils/gateway-constants';

import './TopologySideBar.css';

interface TopologySideBarProps {
  isExpanded: boolean;
  onClose: () => void;
  selectedElement: GraphElement | null;
  children: React.ReactNode;
}

export const TopologySideBar: React.FC<TopologySideBarProps> = ({
  isExpanded,
  onClose,
  selectedElement,
  children,
}) => {
  const { t } = useTranslation('plugin__gatewayapi-console-plugin');

  const renderDetails = () => {
    if (!selectedElement) {
      return null;
    }

    const data = selectedElement.getData();
    const resourceKind = data?.resourceKind;
    const resource = data?.resource;

    if (!resource || !resourceKind) {
      return null;
    }

    switch (selectedElement.getType()) {
      case TYPE_GATEWAY_CLASS:
        return <GatewayClassDetails gatewayClass={resource as GatewayClass} />;

      case TYPE_GATEWAY:
        return <GatewayDetails gateway={resource as Gateway} />;

      case TYPE_HTTP_ROUTE:
        return <HTTPRouteDetails httpRoute={resource as HTTPRoute} />;

      case TYPE_SERVICE:
        return <ServiceDetails service={resource as Service} />;

      case TYPE_LISTENER:
        return (
          <ListenerDetails
            listener={resource}
            gatewayName={data.gatewayName || ''}
            gatewayNamespace={data.gatewayNamespace || ''}
          />
        );

      default:
        return (
          <div className="pf-u-p-md">
            {t('Unknown resource type')}: {resourceKind}
          </div>
        );
    }
  };

  const panelContent = (
    <DrawerPanelContent>
      <DrawerHead>
        <DrawerActions>
          <DrawerCloseButton onClick={onClose} />
        </DrawerActions>
      </DrawerHead>
      <DrawerPanelBody>{renderDetails()}</DrawerPanelBody>
    </DrawerPanelContent>
  );

  return (
    <Drawer isExpanded={isExpanded} isInline>
      <DrawerContent panelContent={panelContent}>
        <DrawerContentBody>{children}</DrawerContentBody>
      </DrawerContent>
    </Drawer>
  );
};
