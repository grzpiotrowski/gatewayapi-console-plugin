// GatewayClass Details Component

import * as React from 'react';
import {
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Title,
  Content,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { GatewayClass } from '../../../types/gateway-api';

interface GatewayClassDetailsProps {
  gatewayClass: GatewayClass;
}

export const GatewayClassDetails: React.FC<GatewayClassDetailsProps> = ({ gatewayClass }) => {
  const { t } = useTranslation('plugin__gatewayapi-console-plugin');

  const acceptedCondition = gatewayClass.status?.conditions?.find((c) => c.type === 'Accepted');

  return (
    <div className="gatewayapi-console-plugin__sidebar-details">
      <Title headingLevel="h2" size="lg">
        {gatewayClass.metadata?.name}
      </Title>
      <Content component="small">{t('GatewayClass')}</Content>

      <DescriptionList className="pf-u-mt-md">
        <DescriptionListGroup>
          <DescriptionListTerm>{t('Controller')}</DescriptionListTerm>
          <DescriptionListDescription>
            {gatewayClass.spec?.controllerName || t('N/A')}
          </DescriptionListDescription>
        </DescriptionListGroup>

        {gatewayClass.spec?.description && (
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Description')}</DescriptionListTerm>
            <DescriptionListDescription>{gatewayClass.spec.description}</DescriptionListDescription>
          </DescriptionListGroup>
        )}

        {acceptedCondition && (
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Status')}</DescriptionListTerm>
            <DescriptionListDescription>
              {acceptedCondition.status === 'True' ? t('Accepted') : t('Not Accepted')}
              {acceptedCondition.message && (
                <>
                  <br />
                  <Content component="small">{acceptedCondition.message}</Content>
                </>
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
        )}

        {gatewayClass.spec?.parametersRef && (
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Parameters')}</DescriptionListTerm>
            <DescriptionListDescription>
              {gatewayClass.spec.parametersRef.kind}/{gatewayClass.spec.parametersRef.name}
              {gatewayClass.spec.parametersRef.namespace && (
                <> ({gatewayClass.spec.parametersRef.namespace})</>
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
        )}
      </DescriptionList>
    </div>
  );
};
