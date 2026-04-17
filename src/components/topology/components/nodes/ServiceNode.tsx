// Service Node Component

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
import { Service } from '../../../../types/gateway-api';
import { CSS_PREFIX, DEFAULT_LAYER, TOP_LAYER } from '../../../../utils/gateway-constants';

import './ServiceNode.css';

type NodeProps = {
  element: GraphElement;
  [key: string]: any;
};

const ServiceNode: React.FC<NodeProps> = ({ element, ...rest }) => {
  const { t } = useTranslation('plugin__gatewayapi-console-plugin');
  const [hover, hoverRef] = useHover();
  const data = element.getData();
  const service = data?.resource as Service;
  const portCount = service?.spec?.ports?.length || 0;

  if (!service) {
    return null;
  }

  return (
    <Layer id={hover ? TOP_LAYER : DEFAULT_LAYER}>
      <g ref={hoverRef as React.LegacyRef<SVGGElement>}>
        <DefaultNode
          element={element as Node}
          badge={t('SVC')}
          badgeColor="#EC7A08"
          badgeClassName={`${CSS_PREFIX}__node-badge`}
          className={`${CSS_PREFIX}__node ${CSS_PREFIX}__node--service`}
          secondaryLabel={portCount > 0 ? `${portCount} ${portCount === 1 ? 'port' : 'ports'}` : undefined}
          {...rest}
        />
      </g>
    </Layer>
  );
};

export default observer(ServiceNode);
