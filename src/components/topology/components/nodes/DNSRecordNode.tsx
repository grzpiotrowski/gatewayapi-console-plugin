// DNSRecord Node Component

import * as React from 'react';
import {
  Node,
  observer,
  useHover,
  DefaultNode,
  Layer,
  GraphElement,
} from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import { DNSRecord } from '../../../../types/gateway-api';
import { CSS_PREFIX, DEFAULT_LAYER, TOP_LAYER } from '../../../../utils/gateway-constants';

import './DNSRecordNode.css';

type NodeProps = {
  element: GraphElement;
  selected?: boolean;
  [key: string]: any;
};

const DNSRecordNode: React.FC<NodeProps> = ({ element, selected, ...rest }) => {
  const { t } = useTranslation('plugin__gatewayapi-console-plugin');
  const [hover, hoverRef] = useHover();
  const data = element.getData();
  const dnsRecord = data?.resource as DNSRecord;

  if (!dnsRecord) {
    return null;
  }

  const fullLabel = element.getLabel() || '';
  const shouldTruncate = !selected && !hover && fullLabel.length > 30;
  const truncatedLabel = shouldTruncate ? `${fullLabel.substring(0, 30)}...` : fullLabel;

  return (
    <Layer id={hover ? TOP_LAYER : DEFAULT_LAYER}>
      <g ref={hoverRef as React.LegacyRef<SVGGElement>}>
        <DefaultNode
          element={element as Node}
          badge={t('DNS')}
          badgeColor="#8476d1"
          badgeClassName={`${CSS_PREFIX}__node-badge`}
          className={`${CSS_PREFIX}__node ${CSS_PREFIX}__node--dns-record`}
          label={truncatedLabel}
          secondaryLabel={dnsRecord.spec.recordType}
          {...rest}
        />
      </g>
    </Layer>
  );
};

export default observer(DNSRecordNode);
