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

type NodeProps = {
  element: GraphElement;
  [key: string]: any;
};

const GatewayNode: React.FC<NodeProps> = ({ element, ...rest }) => {
  const { t } = useTranslation('plugin__gatewayapi-console-plugin');
  const [hover, hoverRef] = useHover();
  const data = element.getData();
  const gateway = data?.resource as Gateway;

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
          {...rest}
        />
      </g>
    </Layer>
  );
};

export default observer(GatewayNode);
