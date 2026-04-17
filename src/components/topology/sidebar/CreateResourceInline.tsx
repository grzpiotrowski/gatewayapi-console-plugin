// Inline Resource Creation Component - for creating resources within topology sidebar

import * as React from 'react';
import {
  ResourceYAMLEditor,
  k8sCreate,
  useK8sModel,
  K8sResourceCommon,
} from '@openshift-console/dynamic-plugin-sdk';
import { Alert, Button, ButtonVariant, ActionGroup } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import * as yaml from 'js-yaml';

interface CreateResourceInlineProps {
  template: any;
  resourceKind: string;
  onSuccess: (resource: K8sResourceCommon) => void;
  onCancel: () => void;
}

export const CreateResourceInline: React.FC<CreateResourceInlineProps> = ({
  template,
  resourceKind,
  onSuccess,
  onCancel,
}) => {
  const { t } = useTranslation('plugin__gatewayapi-console-plugin');
  const [error, setError] = React.useState<string>('');
  const [isCreating, setIsCreating] = React.useState<boolean>(false);

  // Get the K8s model for this resource
  const gvk = React.useMemo(() => {
    // For Service, use core API group
    if (resourceKind === 'Service') {
      return {
        version: 'v1',
        kind: 'Service',
      };
    }

    // For Gateway API resources
    return {
      group: 'gateway.networking.k8s.io',
      version: 'v1',
      kind: resourceKind,
    };
  }, [resourceKind]);

  const [model] = useK8sModel(gvk);

  const handleSave = React.useCallback(
    async (content: string) => {
      setError('');
      setIsCreating(true);

      try {
        // Parse the YAML content
        const resource = yaml.load(content) as K8sResourceCommon;

        if (!resource || typeof resource !== 'object') {
          throw new Error('Invalid YAML content');
        }

        if (!model) {
          throw new Error('Resource model not found');
        }

        // Create the resource
        const createdResource = await k8sCreate({
          model,
          data: resource,
        });

        console.log('[CreateResourceInline] Resource created:', createdResource);

        // Notify parent of success
        onSuccess(createdResource);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        console.error('[CreateResourceInline] Error creating resource:', err);
      } finally {
        setIsCreating(false);
      }
    },
    [model, onSuccess],
  );

  return (
    <div className="gatewayapi-console-plugin__create-inline">
      <div className="pf-v6-u-mb-md">
        <h2 className="pf-v6-c-title pf-m-lg">
          {t('Create {{kind}}', { kind: resourceKind })}
        </h2>
      </div>

      {error && (
        <Alert
          variant="danger"
          title={t('Error creating resource')}
          isInline
          className="pf-v6-u-mb-md"
        >
          {error}
        </Alert>
      )}

      <div className="gatewayapi-console-plugin__create-inline-editor">
        <ResourceYAMLEditor
          initialResource={template}
          onSave={handleSave}
          create
          hideHeader
        />
      </div>

      <ActionGroup className="pf-v6-u-mt-md">
        <Button
          variant={ButtonVariant.secondary}
          onClick={onCancel}
          isDisabled={isCreating}
        >
          {t('Cancel')}
        </Button>
      </ActionGroup>
    </div>
  );
};
