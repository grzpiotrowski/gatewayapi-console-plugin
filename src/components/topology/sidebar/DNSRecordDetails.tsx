// DNSRecord Details Component

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Content,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Title,
  Label,
} from '@patternfly/react-core';
import { DNSRecord } from '../../../types/gateway-api';

export interface DNSRecordDetailsProps {
  dnsRecord: DNSRecord;
}

export const DNSRecordDetails: React.FC<DNSRecordDetailsProps> = ({ dnsRecord }) => {
  const { t } = useTranslation('plugin__gatewayapi-console-plugin');

  const spec = dnsRecord.spec;
  const status = dnsRecord.status;

  return (
    <div className="pf-v6-u-p-md">
      <Title headingLevel="h2" className="pf-v6-u-mb-md">
        {dnsRecord.metadata?.name}
      </Title>

      <DescriptionList isHorizontal isCompact>
        <DescriptionListGroup>
          <DescriptionListTerm>{t('DNS Name')}</DescriptionListTerm>
          <DescriptionListDescription>
            <Content component="small">{spec.dnsName || t('N/A')}</Content>
          </DescriptionListDescription>
        </DescriptionListGroup>

        <DescriptionListGroup>
          <DescriptionListTerm>{t('Type')}</DescriptionListTerm>
          <DescriptionListDescription>
            <Content component="small">{spec.recordType || t('N/A')}</Content>
          </DescriptionListDescription>
        </DescriptionListGroup>

        <DescriptionListGroup>
          <DescriptionListTerm>{t('Targets')}</DescriptionListTerm>
          <DescriptionListDescription>
            {spec.targets && spec.targets.length > 0 ? (
              <div>
                {spec.targets.map((target, idx) => (
                  <Content component="small" key={idx}>
                    {target}
                  </Content>
                ))}
              </div>
            ) : (
              <Content component="small">{t('N/A')}</Content>
            )}
          </DescriptionListDescription>
        </DescriptionListGroup>

        {spec.recordTTL && (
          <DescriptionListGroup>
            <DescriptionListTerm>TTL</DescriptionListTerm>
            <DescriptionListDescription>
              <Content component="small">{spec.recordTTL}</Content>
            </DescriptionListDescription>
          </DescriptionListGroup>
        )}

        {spec.dnsManagementPolicy && (
          <DescriptionListGroup>
            <DescriptionListTerm>{t('DNS Management Policy')}</DescriptionListTerm>
            <DescriptionListDescription>
              <Content component="small">{spec.dnsManagementPolicy}</Content>
            </DescriptionListDescription>
          </DescriptionListGroup>
        )}

        {status?.zones && status.zones.length > 0 && (
          <DescriptionListGroup>
            <DescriptionListTerm>{t('DNS Zones')}</DescriptionListTerm>
            <DescriptionListDescription>
              <div>
                {status.zones.map((zone, idx) => {
                  const publishedCondition = zone.conditions?.find(
                    (c) => c.type === 'Published',
                  );
                  const isPublished = publishedCondition?.status === 'True';

                  return (
                    <div key={idx} className="pf-v6-u-mb-sm">
                      <div className="pf-v6-u-mb-xs">
                        <Content component="small">
                          <strong>Zone ID:</strong> {zone.dnsZone?.id || t('N/A')}
                        </Content>
                      </div>
                      {publishedCondition && (
                        <div>
                          <Label color={isPublished ? 'green' : 'orange'}>
                            {isPublished ? t('Published') : t('Not Programmed')}
                          </Label>
                          {publishedCondition.message && (
                            <Content component="small" className="pf-v6-u-mt-xs">
                              {publishedCondition.message}
                            </Content>
                          )}
                          {publishedCondition.reason && (
                            <Content component="small" className="pf-v6-u-mt-xs">
                              {t('Reason')}: {publishedCondition.reason}
                            </Content>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </DescriptionListDescription>
          </DescriptionListGroup>
        )}
      </DescriptionList>
    </div>
  );
};
