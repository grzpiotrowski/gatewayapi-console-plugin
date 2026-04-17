// Topology SideBar Component

import * as React from 'react';
import {
  DrawerPanelContent,
  Tabs,
  Tab,
  TabTitleText,
  Button,
} from '@patternfly/react-core';
import { TimesIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { GraphElement, TopologySideBar as PFTopologySideBar } from '@patternfly/react-topology';
import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';
import { GatewayClassDetails } from './GatewayClassDetails';
import { GatewayDetails } from './GatewayDetails';
import { HTTPRouteDetails } from './HTTPRouteDetails';
import { ServiceDetails } from './ServiceDetails';
import { ListenerDetails } from './ListenerDetails';
import { YAMLViewer } from './YAMLViewer';
import { CreateResourceInline } from './CreateResourceInline';
import { GatewayClass, Gateway, HTTPRoute, Service } from '../../../types/gateway-api';
import {
  TYPE_GATEWAY_CLASS,
  TYPE_GATEWAY,
  TYPE_HTTP_ROUTE,
  TYPE_SERVICE,
  TYPE_LISTENER,
} from '../../../utils/gateway-constants';

import './TopologySideBar.css';

interface CreateResourceContext {
  template: any;
  resourceKind: string;
}

interface TopologySideBarProps {
  onClose: () => void;
  selectedElement: GraphElement | null;
  selectedResource: any;
  creationContext?: CreateResourceContext;
  onCreationSuccess?: (resource: K8sResourceCommon) => void;
  onCreationCancel?: () => void;
  onCreateResource?: (template: any, resourceKind: string) => void;
}

export const TopologySideBar: React.FC<TopologySideBarProps> = ({
  onClose,
  selectedElement,
  selectedResource,
  creationContext,
  onCreationSuccess,
  onCreationCancel,
  onCreateResource,
}) => {
  const { t } = useTranslation('plugin__gatewayapi-console-plugin');
  const [activeTabKey, setActiveTabKey] = React.useState<string | number>(0);

  // Check if we're in creation mode
  const isCreationMode = !!creationContext;

  // Reset to Details tab when a new element is selected (but not in creation mode)
  React.useEffect(() => {
    if (selectedElement && !isCreationMode) {
      setActiveTabKey(0);
    }
  }, [selectedElement, isCreationMode]);

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
        return (
          <GatewayClassDetails
            gatewayClass={resource as GatewayClass}
            onCreateResource={onCreateResource}
          />
        );

      case TYPE_GATEWAY:
        return (
          <GatewayDetails gateway={resource as Gateway} onCreateResource={onCreateResource} />
        );

      case TYPE_HTTP_ROUTE:
        return (
          <HTTPRouteDetails
            httpRoute={resource as HTTPRoute}
            onCreateResource={onCreateResource}
          />
        );

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

  const renderYAML = () => {
    if (!selectedElement || !selectedResource) {
      return null;
    }

    const data = selectedElement.getData();
    const resourceKind = data?.resourceKind;

    if (!resourceKind) {
      return null;
    }

    // For Listener nodes, pass gateway context
    const listenerContext =
      resourceKind === 'Listener'
        ? {
            gatewayName: data.gatewayName,
            gatewayNamespace: data.gatewayNamespace,
          }
        : undefined;

    return (
      <YAMLViewer
        resource={selectedResource}
        resourceKind={resourceKind}
        listenerContext={listenerContext}
      />
    );
  };

  return (
    <DrawerPanelContent isResizable minSize="400px" defaultSize="500px">
      <PFTopologySideBar resizable className="pf-topology-side-bar-resizable">
        <div className="pf-topology-side-bar__body">
          <div className="co-sidebar-dismiss">
            <Button
              variant="plain"
              onClick={onClose}
              aria-label={t('Close')}
              className="co-sidebar-dismiss__close-button"
            >
              <TimesIcon />
            </Button>
          </div>
          <div className="overview__sidebar-pane resource-overview">
            {isCreationMode && creationContext ? (
              // Creation mode - show inline creation component
              <CreateResourceInline
                template={creationContext.template}
                resourceKind={creationContext.resourceKind}
                onSuccess={onCreationSuccess || (() => {})}
                onCancel={onCreationCancel || onClose}
              />
            ) : (
              // Normal mode - show Details/YAML tabs
              <Tabs
                activeKey={activeTabKey}
                onSelect={(_event, tabIndex) => setActiveTabKey(tabIndex)}
                className="pf-v6-u-mb-md"
                inset={{ default: 'insetSm' }}
                unmountOnExit
              >
                <Tab eventKey={0} title={<TabTitleText>{t('Details')}</TabTitleText>}>
                  <div className="gatewayapi-console-plugin__sidebar-tabsection">
                    {renderDetails()}
                  </div>
                </Tab>
                <Tab eventKey={1} title={<TabTitleText>{t('YAML')}</TabTitleText>}>
                  <React.Suspense fallback={<div>{t('Loading...')}</div>}>
                    {renderYAML()}
                  </React.Suspense>
                </Tab>
              </Tabs>
            )}
          </div>
        </div>
      </PFTopologySideBar>
    </DrawerPanelContent>
  );
};
