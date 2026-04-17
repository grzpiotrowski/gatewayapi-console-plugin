// YAML Viewer Component - editable YAML display with save

import * as React from 'react';
import {
  ResourceYAMLEditor,
  k8sUpdate,
  k8sGet,
  useK8sModel,
  getGroupVersionKindForResource,
  K8sResourceCommon,
} from '@openshift-console/dynamic-plugin-sdk';
import { Alert } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import * as yaml from 'js-yaml';
import { Gateway } from '../../../types/gateway-api';
import { GATEWAY_API_GROUP, GATEWAY_API_VERSION } from '../../../utils/gateway-constants';

interface ListenerContext {
  gatewayName: string;
  gatewayNamespace: string;
}

interface YAMLViewerProps {
  resource: any;
  resourceKind: string;
  listenerContext?: ListenerContext;
}

export const YAMLViewer: React.FC<YAMLViewerProps> = ({
  resource,
  resourceKind,
  listenerContext,
}) => {
  const { t } = useTranslation('plugin__gatewayapi-console-plugin');
  const [error, setError] = React.useState<string>('');
  const [success, setSuccess] = React.useState<string>('');

  // For Listeners, we need the Gateway model
  const isListener = resourceKind === 'Listener';
  const gvk = React.useMemo(() => {
    if (isListener) {
      return {
        group: GATEWAY_API_GROUP,
        version: GATEWAY_API_VERSION,
        kind: 'Gateway',
      };
    }
    return getGroupVersionKindForResource(resource);
  }, [resource, isListener]);

  const [model] = useK8sModel(gvk);

  const handleSave = React.useCallback(
    async (content: string) => {
      setError('');
      setSuccess('');

      try {
        if (!model) {
          throw new Error('Resource model not found');
        }

        // Parse the YAML content
        const parsedYaml = yaml.load(content);

        if (!parsedYaml || typeof parsedYaml !== 'object') {
          throw new Error('Invalid YAML content');
        }

        // Handle Listener editing specially
        if (isListener && listenerContext) {
          // Fetch the parent Gateway
          const gateway = (await k8sGet({
            model,
            name: listenerContext.gatewayName,
            ns: listenerContext.gatewayNamespace,
          })) as Gateway;

          if (!gateway.spec?.listeners) {
            throw new Error('Gateway has no listeners');
          }

          // Find the listener by name and update it
          const listenerName = resource.name;
          const listenerIndex = gateway.spec.listeners.findIndex(
            (l) => l.name === listenerName,
          );

          if (listenerIndex === -1) {
            throw new Error(`Listener '${listenerName}' not found in Gateway`);
          }

          // Update the specific listener
          gateway.spec.listeners[listenerIndex] = parsedYaml as any;

          // Save the entire Gateway
          await k8sUpdate({
            model,
            data: gateway,
            ns: gateway.metadata?.namespace,
            name: gateway.metadata?.name,
          });

          setSuccess(t('Listener updated successfully'));
        } else {
          // Regular resource update
          const updatedResource = parsedYaml as K8sResourceCommon;

          await k8sUpdate({
            model,
            data: updatedResource,
            ns: updatedResource.metadata?.namespace,
            name: updatedResource.metadata?.name,
          });

          setSuccess(t('Resource updated successfully'));
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        console.error('[YAMLViewer] Error saving resource:', err);
      }
    },
    [model, t, isListener, listenerContext, resource],
  );

  // Create a unique key for the editor
  // For Listeners: use a hash of the listener YAML content
  // For regular resources: use resourceVersion
  const editorKey = React.useMemo(() => {
    if (isListener) {
      return JSON.stringify(resource);
    }
    return resource?.metadata?.resourceVersion;
  }, [resource, isListener]);

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
        key={editorKey}
        initialResource={resource}
        onSave={handleSave}
        hideHeader
      />
    </div>
  );
};
