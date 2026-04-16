// Service Details Component

import * as React from 'react';
import {
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Title,
  Content,
  Label,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Service } from '../../../types/gateway-api';

interface ServiceDetailsProps {
  service: Service;
}

export const ServiceDetails: React.FC<ServiceDetailsProps> = ({ service }) => {
  const { t } = useTranslation('plugin__gatewayapi-console-plugin');

  return (
    <div className="gatewayapi-console-plugin__sidebar-details">
      <Title headingLevel="h2" size="lg">
        {service.metadata?.name}
      </Title>
      <Content component="small">
        {t('Service')} • {service.metadata?.namespace}
      </Content>

      <DescriptionList className="pf-u-mt-md">
        <DescriptionListGroup>
          <DescriptionListTerm>{t('Type')}</DescriptionListTerm>
          <DescriptionListDescription>
            {service.spec?.type || 'ClusterIP'}
          </DescriptionListDescription>
        </DescriptionListGroup>

        {service.spec?.clusterIP && (
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Cluster IP')}</DescriptionListTerm>
            <DescriptionListDescription>{service.spec.clusterIP}</DescriptionListDescription>
          </DescriptionListGroup>
        )}

        {service.spec?.ports && service.spec.ports.length > 0 && (
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Ports')}</DescriptionListTerm>
            <DescriptionListDescription>
              {service.spec.ports.map((port, idx) => (
                <div key={idx} className="pf-u-mb-xs">
                  <Label color="orange">
                    {port.name || `port-${idx}`}: {port.port}
                    {port.targetPort ? ` → ${port.targetPort}` : ''}
                    {port.protocol && port.protocol !== 'TCP' ? ` (${port.protocol})` : ''}
                  </Label>
                </div>
              ))}
            </DescriptionListDescription>
          </DescriptionListGroup>
        )}

        {service.spec?.selector && Object.keys(service.spec.selector).length > 0 && (
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Selector')}</DescriptionListTerm>
            <DescriptionListDescription>
              <div className="pf-u-mt-xs">
                {Object.entries(service.spec.selector).map(([key, value]) => (
                  <div key={key}>
                    <Content component="small">
                      {key}={value}
                    </Content>
                  </div>
                ))}
              </div>
            </DescriptionListDescription>
          </DescriptionListGroup>
        )}

        {service.status?.loadBalancer?.ingress && (
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Load Balancer')}</DescriptionListTerm>
            <DescriptionListDescription>
              {service.status.loadBalancer.ingress.map((ingress, idx) => (
                <div key={idx}>{ingress.ip || ingress.hostname}</div>
              ))}
            </DescriptionListDescription>
          </DescriptionListGroup>
        )}
      </DescriptionList>
    </div>
  );
};
