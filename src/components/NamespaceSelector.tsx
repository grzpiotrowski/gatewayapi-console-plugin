// Namespace selector component for filtering topology view

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectOption,
  SelectList,
  MenuToggle,
  MenuToggleElement,
  Badge,
  TextInputGroup,
  TextInputGroupMain,
  TextInputGroupUtilities,
  Button,
} from '@patternfly/react-core';
import { TimesIcon } from '@patternfly/react-icons';
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';

interface NamespaceSelectorProps {
  selectedNamespaces: string[];
  onSelectionChange: (namespaces: string[]) => void;
}

type Namespace = K8sResourceCommon & {
  metadata: {
    name: string;
  };
};

export const NamespaceSelector: React.FC<NamespaceSelectorProps> = ({
  selectedNamespaces,
  onSelectionChange,
}) => {
  const { t } = useTranslation('plugin__gatewayapi-console-plugin');
  const [isOpen, setIsOpen] = React.useState(false);
  const [filterValue, setFilterValue] = React.useState('');
  const textInputRef = React.useRef<HTMLInputElement>(null);

  // Watch all namespaces
  const [namespaces, loaded] = useK8sWatchResource<Namespace[]>({
    isList: true,
    groupVersionKind: {
      version: 'v1',
      kind: 'Namespace',
    },
    namespaced: false,
  });

  const namespaceNames = React.useMemo(() => {
    if (!loaded || !namespaces) return [];
    return namespaces.map((ns) => ns.metadata.name).sort();
  }, [namespaces, loaded]);

  // Filter namespaces based on search
  const filteredNamespaces = React.useMemo(() => {
    if (!filterValue) return namespaceNames;
    return namespaceNames.filter((ns) => ns.toLowerCase().includes(filterValue.toLowerCase()));
  }, [namespaceNames, filterValue]);

  const onToggleClick = () => {
    setIsOpen(!isOpen);
  };

  const onSelect = (_event: React.MouseEvent | undefined, value: string | number | undefined) => {
    const selection = value as string;

    if (selectedNamespaces.includes(selection)) {
      // Deselect this namespace
      const newSelections = selectedNamespaces.filter((ns) => ns !== selection);
      onSelectionChange(newSelections);
    } else {
      // Select this namespace
      onSelectionChange([...selectedNamespaces, selection]);
    }
  };

  const toggle = (toggleRef: React.Ref<MenuToggleElement>) => {
    const showingAll = selectedNamespaces.length === 0 || selectedNamespaces.includes('all');

    return (
      <MenuToggle
        ref={toggleRef}
        onClick={onToggleClick}
        isExpanded={isOpen}
        style={{ minWidth: '200px' }}
      >
        {showingAll ? (
          <>
            {t('All namespaces')} <Badge isRead>{namespaceNames.length}</Badge>
          </>
        ) : (
          <>
            {t('Namespaces')} <Badge isRead>{selectedNamespaces.length}</Badge>
          </>
        )}
      </MenuToggle>
    );
  };

  const handleFilter = (value: string) => {
    setFilterValue(value);
  };

  const clearFilter = () => {
    setFilterValue('');
  };

  return (
    <Select
      isOpen={isOpen}
      selected={selectedNamespaces}
      onSelect={onSelect}
      onOpenChange={(nextOpen) => {
        setIsOpen(nextOpen);
        if (!nextOpen) {
          setFilterValue('');
        }
      }}
      toggle={toggle}
    >
      <TextInputGroup>
        <TextInputGroupMain
          value={filterValue}
          onChange={(_event, value) => handleFilter(value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
            }
          }}
          ref={textInputRef}
          placeholder={t('Search namespaces')}
          autoComplete="off"
        />
        {filterValue && (
          <TextInputGroupUtilities>
            <Button
              variant="plain"
              onClick={clearFilter}
              aria-label={t('Clear filter')}
            >
              <TimesIcon />
            </Button>
          </TextInputGroupUtilities>
        )}
      </TextInputGroup>
      <SelectList style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {filteredNamespaces.map((ns) => (
          <SelectOption
            key={ns}
            value={ns}
            isSelected={selectedNamespaces.includes(ns)}
            hasCheckbox
          >
            {ns}
          </SelectOption>
        ))}
        {filteredNamespaces.length === 0 && filterValue && (
          <SelectOption isDisabled key="no-results">
            {t('No namespaces found')}
          </SelectOption>
        )}
      </SelectList>
    </Select>
  );
};
