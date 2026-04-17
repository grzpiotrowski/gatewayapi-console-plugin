// Create HTTPRoute Page

import * as React from 'react';
import CreateResourcePage from './CreateResourcePage';

interface CreateHTTPRoutePageProps {
  namespace?: string;
}

const CreateHTTPRoutePage: React.FC<CreateHTTPRoutePageProps> = ({ namespace }) => {
  return <CreateResourcePage resourceKind="HTTPRoute" namespace={namespace} />;
};

export default CreateHTTPRoutePage;
