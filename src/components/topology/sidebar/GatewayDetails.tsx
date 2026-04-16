// Gateway Details Component

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
import { Gateway } from '../../../types/gateway-api';

interface GatewayDetailsProps {
  gateway: Gateway;
}

export const GatewayDetails: React.FC<GatewayDetailsProps> = ({ gateway }) => {
  const { t } = useTranslation('plugin__gatewayapi-console-plugin');

  const acceptedCondition = gateway.status?.conditions?.find((c) => c.type === 'Accepted');
  const programmedCondition = gateway.status?.conditions?.find((c) => c.type === 'Programmed');

  return (
    <div className="gatewayapi-console-plugin__sidebar-details">
      <Title headingLevel="h2" size="lg">
        {gateway.metadata?.name}
      </Title>
      <Content component="small">
        {t('Gateway')} • {gateway.metadata?.namespace}
      </Content>

      <DescriptionList className="pf-u-mt-md">
        <DescriptionListGroup>
          <DescriptionListTerm>{t('Gateway Class')}</DescriptionListTerm>
          <DescriptionListDescription>
            {gateway.spec?.gatewayClassName || t('N/A')}
          </DescriptionListDescription>
        </DescriptionListGroup>

        <DescriptionListGroup>
          <DescriptionListTerm>{t('Listeners')}</DescriptionListTerm>
          <DescriptionListDescription>
            {gateway.spec?.listeners && gateway.spec.listeners.length > 0 ? (
              <div className="pf-u-mt-sm">
                {gateway.spec.listeners.map((listener) => (
                  <div key={listener.name} className="pf-u-mb-sm">
                    <Label color="blue">{listener.name}</Label>
                    <Content component="small" className="pf-u-ml-sm">
                      {listener.protocol}:{listener.port}
                      {listener.hostname && ` • ${listener.hostname}`}
                    </Content>
                  </div>
                ))}
              </div>
            ) : (
              t('No listeners')
            )}
          </DescriptionListDescription>
        </DescriptionListGroup>

        {gateway.status?.addresses && gateway.status.addresses.length > 0 && (
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Addresses')}</DescriptionListTerm>
            <DescriptionListDescription>
              {gateway.status.addresses.map((addr, idx) => (
                <div key={idx}>{addr.value}</div>
              ))}
            </DescriptionListDescription>
          </DescriptionListGroup>
        )}

        <DescriptionListGroup>
          <DescriptionListTerm>{t('Status')}</DescriptionListTerm>
          <DescriptionListDescription>
            <div>
              {acceptedCondition && (
                <div className="pf-u-mb-xs">
                  <strong>{t('Accepted')}:</strong>{' '}
                  {acceptedCondition.status === 'True' ? t('Yes') : t('No')}
                  {acceptedCondition.message && (
                    <>
                      <br />
                      <Content component="small">{acceptedCondition.message}</Content>
                    </>
                  )}
                </div>
              )}
              {programmedCondition && (
                <div>
                  <strong>{t('Programmed')}:</strong>{' '}
                  {programmedCondition.status === 'True' ? t('Yes') : t('No')}
                  {programmedCondition.message && (
                    <>
                      <br />
                      <Content component="small">{programmedCondition.message}</Content>
                    </>
                  )}
                </div>
              )}
            </div>
          </DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>
    </div>
  );
};
