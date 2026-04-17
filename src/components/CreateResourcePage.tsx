// Create Resource Page - Generic YAML-based resource creation

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  PageSection,
  Title,
  Alert,
  Breadcrumb,
  BreadcrumbItem,
} from '@patternfly/react-core';
import {
  ResourceYAMLEditor,
  k8sCreate,
  useK8sModel,
  K8sResourceCommon,
} from '@openshift-console/dynamic-plugin-sdk';
import * as yaml from 'js-yaml';
import { gatewayClassTemplate, gatewayTemplate, httpRouteTemplate } from '../templates';

interface CreateResourcePageProps {
  namespace?: string;
  resourceKind: 'GatewayClass' | 'Gateway' | 'HTTPRoute';
}

const CreateResourcePage: React.FC<CreateResourcePageProps> = ({ namespace, resourceKind }) => {
  const { t } = useTranslation('plugin__gatewayapi-console-plugin');
  const [error, setError] = React.useState<string>('');

  // Get template based on resource kind
  const initialResource = React.useMemo(() => {
    let template;
    switch (resourceKind) {
      case 'GatewayClass':
        template = gatewayClassTemplate;
        break;
      case 'Gateway':
        template = { ...gatewayTemplate };
        if (namespace) {
          template.metadata.namespace = namespace;
        }
        break;
      case 'HTTPRoute':
        template = { ...httpRouteTemplate };
        if (namespace) {
          template.metadata.namespace = namespace;
        }
        break;
      default:
        template = {};
    }
    return template;
  }, [resourceKind, namespace]);

  // Get the K8s model for this resource
  const gvk = React.useMemo(() => {
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

        console.log('[CreateResourcePage] Resource created:', createdResource);

        // Navigate back to topology view after successful creation
        window.location.href = '/gateway-topology';
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        console.error('[CreateResourcePage] Error creating resource:', err);
      }
    },
    [model],
  );

  return (
    <>
      <PageSection variant="default">
        <Breadcrumb>
          <BreadcrumbItem to="/gatewayapi-topology">{t('Gateway API Topology')}</BreadcrumbItem>
          <BreadcrumbItem isActive>
            {t('Create {{kind}}', { kind: resourceKind })}
          </BreadcrumbItem>
        </Breadcrumb>
        <Title headingLevel="h1" className="pf-v6-u-mt-md">
          {t('Create {{kind}}', { kind: resourceKind })}
        </Title>
      </PageSection>
      <PageSection isFilled hasBodyWrapper={false} padding={{ default: 'noPadding' }}>
        {error && (
          <Alert
            variant="danger"
            title={t('Error creating resource')}
            isInline
            className="pf-v6-u-m-md"
          >
            {error}
          </Alert>
        )}
        <React.Suspense fallback={<div>{t('Loading...')}</div>}>
          <ResourceYAMLEditor
            initialResource={initialResource}
            header={t('Create {{kind}}', { kind: resourceKind })}
            onSave={handleSave}
            create
          />
        </React.Suspense>
      </PageSection>
    </>
  );
};

export default CreateResourcePage;
