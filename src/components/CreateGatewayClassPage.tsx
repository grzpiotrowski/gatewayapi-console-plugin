// Create GatewayClass Page

import * as React from 'react';
import CreateResourcePage from './CreateResourcePage';

interface CreateGatewayClassPageProps {
  namespace?: string;
}

const CreateGatewayClassPage: React.FC<CreateGatewayClassPageProps> = ({ namespace }) => {
  return <CreateResourcePage resourceKind="GatewayClass" namespace={namespace} />;
};

export default CreateGatewayClassPage;
