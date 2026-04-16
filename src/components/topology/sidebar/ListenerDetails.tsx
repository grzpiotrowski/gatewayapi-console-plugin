// Listener Details Component

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
import { Listener } from '../../../types/gateway-api';

interface ListenerDetailsProps {
  listener: Listener;
  gatewayName: string;
  gatewayNamespace: string;
}

export const ListenerDetails: React.FC<ListenerDetailsProps> = ({
  listener,
  gatewayName,
  gatewayNamespace,
}) => {
  const { t } = useTranslation('plugin__gatewayapi-console-plugin');

  return (
    <div className="gatewayapi-console-plugin__sidebar-details">
      <Title headingLevel="h2" size="lg">
        {listener.name}
      </Title>
      <Content component="small">
        {t('Listener')} • {gatewayName} ({gatewayNamespace})
      </Content>

      <DescriptionList className="pf-u-mt-md">
        <DescriptionListGroup>
          <DescriptionListTerm>{t('Protocol')}</DescriptionListTerm>
          <DescriptionListDescription>
            <Label color="blue">{listener.protocol}</Label>
          </DescriptionListDescription>
        </DescriptionListGroup>

        <DescriptionListGroup>
          <DescriptionListTerm>{t('Port')}</DescriptionListTerm>
          <DescriptionListDescription>{listener.port}</DescriptionListDescription>
        </DescriptionListGroup>

        {listener.hostname && (
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Hostname')}</DescriptionListTerm>
            <DescriptionListDescription>
              <Label color="teal">{listener.hostname}</Label>
            </DescriptionListDescription>
          </DescriptionListGroup>
        )}

        {listener.tls && (
          <DescriptionListGroup>
            <DescriptionListTerm>{t('TLS')}</DescriptionListTerm>
            <DescriptionListDescription>
              <div>
                {listener.tls.mode && (
                  <div>
                    <strong>{t('Mode')}:</strong> {listener.tls.mode}
                  </div>
                )}
                {listener.tls.certificateRefs && listener.tls.certificateRefs.length > 0 && (
                  <div>
                    <strong>{t('Certificates')}:</strong>{' '}
                    {listener.tls.certificateRefs.map((ref) => ref.name).join(', ')}
                  </div>
                )}
              </div>
            </DescriptionListDescription>
          </DescriptionListGroup>
        )}

        {listener.allowedRoutes && (
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Allowed Routes')}</DescriptionListTerm>
            <DescriptionListDescription>
              {listener.allowedRoutes.namespaces?.from && (
                <div>
                  <strong>{t('Namespaces')}:</strong> {listener.allowedRoutes.namespaces.from}
                </div>
              )}
              {listener.allowedRoutes.kinds && listener.allowedRoutes.kinds.length > 0 && (
                <div>
                  <strong>{t('Kinds')}:</strong>{' '}
                  {listener.allowedRoutes.kinds.map((k) => k.kind).join(', ')}
                </div>
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
        )}
      </DescriptionList>
    </div>
  );
};
