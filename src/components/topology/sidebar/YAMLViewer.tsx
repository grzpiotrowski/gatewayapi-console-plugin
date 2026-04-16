// YAML Viewer Component - read-only YAML display

import * as React from 'react';
import { ResourceYAMLEditor } from '@openshift-console/dynamic-plugin-sdk';

interface YAMLViewerProps {
  resource: any;
}

export const YAMLViewer: React.FC<YAMLViewerProps> = ({ resource }) => {
  return (
    <div className="gatewayapi-console-plugin__yaml-viewer">
      <ResourceYAMLEditor
        initialResource={resource}
        readOnly
        hideHeader
      />
    </div>
  );
};
