// HTTPRoute Details Component

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
import { HTTPRoute } from '../../../types/gateway-api';

interface HTTPRouteDetailsProps {
  httpRoute: HTTPRoute;
}

export const HTTPRouteDetails: React.FC<HTTPRouteDetailsProps> = ({ httpRoute }) => {
  const { t } = useTranslation('plugin__gatewayapi-console-plugin');

  const parentStatus = httpRoute.status?.parents?.[0];
  const acceptedCondition = parentStatus?.conditions?.find((c) => c.type === 'Accepted');

  return (
    <div className="gatewayapi-console-plugin__sidebar-details">
      <Title headingLevel="h2" size="lg">
        {httpRoute.metadata?.name}
      </Title>
      <Content component="small">
        {t('HTTPRoute')} • {httpRoute.metadata?.namespace}
      </Content>

      <DescriptionList className="pf-u-mt-md">
        {httpRoute.spec?.hostnames && httpRoute.spec.hostnames.length > 0 && (
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Hostnames')}</DescriptionListTerm>
            <DescriptionListDescription>
              {httpRoute.spec.hostnames.map((hostname, idx) => (
                <div key={idx}>
                  <Label color="teal">{hostname}</Label>
                </div>
              ))}
            </DescriptionListDescription>
          </DescriptionListGroup>
        )}

        {httpRoute.spec?.parentRefs && httpRoute.spec.parentRefs.length > 0 && (
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Parent References')}</DescriptionListTerm>
            <DescriptionListDescription>
              {httpRoute.spec.parentRefs.map((ref, idx) => (
                <div key={idx} className="pf-u-mb-xs">
                  <Label color="blue">
                    {ref.namespace ? `${ref.namespace}/` : ''}
                    {ref.name}
                    {ref.sectionName ? ` (${ref.sectionName})` : ''}
                  </Label>
                </div>
              ))}
            </DescriptionListDescription>
          </DescriptionListGroup>
        )}

        {httpRoute.spec?.rules && httpRoute.spec.rules.length > 0 && (
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Rules')}</DescriptionListTerm>
            <DescriptionListDescription>
              {t('{{count}} rule', { count: httpRoute.spec.rules.length })}
              <div className="pf-u-mt-sm">
                {httpRoute.spec.rules.map((rule, idx) => (
                  <div key={idx} className="pf-u-mb-sm">
                    <strong>
                      {t('Rule')} {idx + 1}:
                    </strong>
                    <div className="pf-u-ml-md">
                      {rule.backendRefs && rule.backendRefs.length > 0 && (
                        <div>
                          <Content component="small">
                            {t('Backends')}:{' '}
                            {rule.backendRefs
                              .map((backend) => {
                                const ns = backend.namespace || httpRoute.metadata?.namespace;
                                return ns ? `${ns}/${backend.name}` : backend.name;
                              })
                              .join(', ')}
                          </Content>
                        </div>
                      )}
                      {rule.matches && rule.matches.length > 0 && (
                        <div>
                          <Content component="small">
                            {t('Matches')}: {rule.matches.length}
                          </Content>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </DescriptionListDescription>
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
      </DescriptionList>
    </div>
  );
};
