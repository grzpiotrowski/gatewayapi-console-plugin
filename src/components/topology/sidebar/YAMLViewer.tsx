// YAML Viewer Component - editable YAML display with save

import * as React from 'react';
import {
  ResourceYAMLEditor,
  k8sUpdate,
  useK8sModel,
  getGroupVersionKindForResource,
  K8sResourceCommon,
} from '@openshift-console/dynamic-plugin-sdk';
import { Alert } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import * as yaml from 'js-yaml';

interface YAMLViewerProps {
  resource: any;
  resourceKind: string;
}

export const YAMLViewer: React.FC<YAMLViewerProps> = ({ resource, resourceKind }) => {
  const { t } = useTranslation('plugin__gatewayapi-console-plugin');
  const [error, setError] = React.useState<string>('');
  const [success, setSuccess] = React.useState<string>('');

  // Get the proper K8s model using the SDK hook
  const gvk = React.useMemo(() => getGroupVersionKindForResource(resource), [resource]);
  const [model] = useK8sModel(gvk);

  const handleSave = React.useCallback(
    async (content: string) => {
      setError('');
      setSuccess('');

      try {
        // Parse the YAML content
        const updatedResource = yaml.load(content) as K8sResourceCommon;

        if (!updatedResource || typeof updatedResource !== 'object') {
          throw new Error('Invalid YAML content');
        }

        if (!model) {
          throw new Error('Resource model not found');
        }

        // Update the resource
        await k8sUpdate({
          model,
          data: updatedResource,
          ns: updatedResource.metadata?.namespace,
          name: updatedResource.metadata?.name,
        });

        setSuccess(t('Resource updated successfully'));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        console.error('[YAMLViewer] Error saving resource:', err);
      }
    },
    [model, t],
  );

  return (
    <div className="gatewayapi-console-plugin__yaml-viewer">
      {error && (
        <Alert variant="danger" title={t('Error saving resource')} isInline>
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" title={t('Success')} isInline>
          {success}
        </Alert>
      )}
      <ResourceYAMLEditor
        key={resource?.metadata?.resourceVersion}
        initialResource={resource}
        onSave={handleSave}
        hideHeader
      />
    </div>
  );
};
