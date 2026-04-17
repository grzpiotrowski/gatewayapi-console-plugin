// GatewayClass Details Component

import * as React from 'react';
import {
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Title,
  Content,
  Button,
  ButtonVariant,
} from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { useActiveNamespace } from '@openshift-console/dynamic-plugin-sdk';
import { GatewayClass } from '../../../types/gateway-api';
import { createGatewayTemplateForClass } from '../../../utils/template-generators';

interface GatewayClassDetailsProps {
  gatewayClass: GatewayClass;
  onCreateResource?: (template: any, resourceKind: string) => void;
}

export const GatewayClassDetails: React.FC<GatewayClassDetailsProps> = ({
  gatewayClass,
  onCreateResource,
}) => {
  const { t } = useTranslation('plugin__gatewayapi-console-plugin');
  const [activeNamespace] = useActiveNamespace();

  const acceptedCondition = gatewayClass.status?.conditions?.find((c) => c.type === 'Accepted');

  const handleCreateGateway = React.useCallback(() => {
    if (onCreateResource) {
      const template = createGatewayTemplateForClass(gatewayClass, activeNamespace || 'default');
      onCreateResource(template, 'Gateway');
    }
  }, [onCreateResource, gatewayClass, activeNamespace]);

  return (
    <div className="gatewayapi-console-plugin__sidebar-details">
      <div className="pf-v6-u-display-flex pf-v6-u-justify-content-space-between pf-v6-u-align-items-center">
        <div>
          <Title headingLevel="h2" size="lg">
            {gatewayClass.metadata?.name}
          </Title>
          <Content component="small">{t('GatewayClass')}</Content>
        </div>
        {onCreateResource && (
          <Button
            variant={ButtonVariant.secondary}
            icon={<PlusCircleIcon />}
            onClick={handleCreateGateway}
          >
            {t('Create Gateway')}
          </Button>
        )}
      </div>

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
