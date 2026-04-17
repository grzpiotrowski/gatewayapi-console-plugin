// Create Gateway Page

import * as React from 'react';
import CreateResourcePage from './CreateResourcePage';

interface CreateGatewayPageProps {
  namespace?: string;
}

const CreateGatewayPage: React.FC<CreateGatewayPageProps> = ({ namespace }) => {
  return <CreateResourcePage resourceKind="Gateway" namespace={namespace} />;
};

export default CreateGatewayPage;
