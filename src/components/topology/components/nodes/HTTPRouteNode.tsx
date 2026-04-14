// HTTPRoute Node Component

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
import { HTTPRoute } from '../../../../types/gateway-api';
import { CSS_PREFIX, DEFAULT_LAYER, TOP_LAYER } from '../../../../utils/gateway-constants';

import './HTTPRouteNode.css';

interface HTTPRouteNodeProps {
  element: GraphElement;
}

const HTTPRouteNode: React.FC<HTTPRouteNodeProps> = ({ element }) => {
  const { t } = useTranslation('plugin__gatewayapi-console-plugin');
  const [hover, hoverRef] = useHover();
  const data = element.getData();
  const route = data?.resource as HTTPRoute;
  const ruleCount = route?.spec?.rules?.length || 0;

  if (!route) {
    return null;
  }

  return (
    <Layer id={hover ? TOP_LAYER : DEFAULT_LAYER}>
      <g ref={hoverRef as React.LegacyRef<SVGGElement>}>
        <DefaultNode
          element={element as Node}
          showStatusDecorator
          badge={t('HR')}
          badgeColor="#3E8635"
          badgeClassName={`${CSS_PREFIX}__node-badge`}
          className={`${CSS_PREFIX}__node ${CSS_PREFIX}__node--httproute`}
          secondaryLabel={ruleCount > 0 ? t('{{count}} rule', { count: ruleCount }) : undefined}
        />
      </g>
    </Layer>
  );
};

export default observer(HTTPRouteNode);
