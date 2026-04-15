// Listener Node Component

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
import { Listener } from '../../../../types/gateway-api';
import { CSS_PREFIX, DEFAULT_LAYER, TOP_LAYER } from '../../../../utils/gateway-constants';

import './ListenerNode.css';

interface ListenerNodeProps {
  element: GraphElement;
}

const ListenerNode: React.FC<ListenerNodeProps> = ({ element }) => {
  const { t } = useTranslation('plugin__gatewayapi-console-plugin');
  const [hover, hoverRef] = useHover();
  const data = element.getData();
  const listener = data?.resource as Listener;

  if (!listener) {
    return null;
  }

  // Format secondary label with protocol and port
  const secondaryLabel = `${listener.protocol}:${listener.port}`;

  return (
    <Layer id={hover ? TOP_LAYER : DEFAULT_LAYER}>
      <g ref={hoverRef as React.LegacyRef<SVGGElement>}>
        <DefaultNode
          element={element as Node}
          showStatusDecorator={false}
          badge={t('L')}
          badgeColor="#009596"
          badgeClassName={`${CSS_PREFIX}__node-badge`}
          className={`${CSS_PREFIX}__node ${CSS_PREFIX}__node--listener`}
          secondaryLabel={secondaryLabel}
        />
      </g>
    </Layer>
  );
};

export default observer(ListenerNode);
