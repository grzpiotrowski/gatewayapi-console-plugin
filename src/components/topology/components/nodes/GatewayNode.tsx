// Gateway Node Component

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
import { Gateway } from '../../../../types/gateway-api';
import { CSS_PREFIX, DEFAULT_LAYER, TOP_LAYER } from '../../../../utils/gateway-constants';

import './GatewayNode.css';

interface GatewayNodeProps {
  element: GraphElement;
}

const GatewayNode: React.FC<GatewayNodeProps> = ({ element }) => {
  const { t } = useTranslation('plugin__gatewayapi-console-plugin');
  const [hover, hoverRef] = useHover();
  const data = element.getData();
  const gateway = data?.resource as Gateway;
  const listenerCount = gateway?.spec?.listeners?.length || 0;

  if (!gateway) {
    return null;
  }

  return (
    <Layer id={hover ? TOP_LAYER : DEFAULT_LAYER}>
      <g ref={hoverRef as React.LegacyRef<SVGGElement>}>
        <DefaultNode
          element={element as Node}
          showStatusDecorator
          badge={t('GW')}
          badgeColor="#0066CC"
          badgeClassName={`${CSS_PREFIX}__node-badge`}
          className={`${CSS_PREFIX}__node ${CSS_PREFIX}__node--gateway`}
          secondaryLabel={
            listenerCount > 0 ? t('{{count}} listener', { count: listenerCount }) : undefined
          }
        />
      </g>
    </Layer>
  );
};

export default observer(GatewayNode);
