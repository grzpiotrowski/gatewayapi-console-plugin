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
  Button,
  ButtonVariant,
} from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { Gateway } from '../../../types/gateway-api';
import { createHTTPRouteTemplateForGateway } from '../../../utils/template-generators';

interface GatewayDetailsProps {
  gateway: Gateway;
  onCreateResource?: (template: any, resourceKind: string) => void;
}

export const GatewayDetails: React.FC<GatewayDetailsProps> = ({ gateway, onCreateResource }) => {
  const { t } = useTranslation('plugin__gatewayapi-console-plugin');

  const acceptedCondition = gateway.status?.conditions?.find((c) => c.type === 'Accepted');
  const programmedCondition = gateway.status?.conditions?.find((c) => c.type === 'Programmed');

  const handleCreateHTTPRoute = React.useCallback(() => {
    if (onCreateResource) {
      const template = createHTTPRouteTemplateForGateway(gateway);
      onCreateResource(template, 'HTTPRoute');
    }
  }, [onCreateResource, gateway]);

  return (
    <div className="gatewayapi-console-plugin__sidebar-details">
      <div className="pf-v6-u-display-flex pf-v6-u-justify-content-space-between pf-v6-u-align-items-center">
        <div>
          <Title headingLevel="h2" size="lg">
            {gateway.metadata?.name}
          </Title>
          <Content component="small">
            {t('Gateway')} • {gateway.metadata?.namespace}
          </Content>
        </div>
        {onCreateResource && (
          <Button
            variant={ButtonVariant.secondary}
            icon={<PlusCircleIcon />}
            onClick={handleCreateHTTPRoute}
          >
            {t('Create HTTPRoute')}
          </Button>
        )}
      </div>

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
