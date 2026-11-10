// No page-specific CSS, styles or MUI imports. A new page should get usable
// geometry by composing the supported primitives alone.
import React from 'react';
import { UiPage, UiSection, UiField, UiMenuItem, UiAction, UiCard, UiIcon, UiTable, UiReferenceList, UiReferenceEntry } from '../../src/components/ui';
const references = [{ name: 'Example reference with a real-length name', description: ['The complete first paragraph remains beside its name.', 'The second paragraph is visible in a reference directory.'] }];

export default function NewPageFixture() {
  return <UiPage width="reading" title="Example page" description="Shared page geometry" actions={<UiAction variant="primary"><UiIcon name="add" />Create item</UiAction>}>
    <UiSection title="Details"><UiField fullWidth label="Name" defaultValue="Example item" /><UiField select fullWidth label="Record status" defaultValue="active"><UiMenuItem value="active">Active</UiMenuItem></UiField><UiAction>Save details</UiAction></UiSection>
    <UiCard><UiSection title="Preview"><p>Content is composed without a second page header or custom control CSS.</p></UiSection></UiCard>
    <UiTable label="Example records" columns={[
      { key: 'name', label: 'Name' }, { key: 'id', label: 'Public ID', code: true },
      { key: 'actions', label: 'Actions', render: () => <UiAction>Review record</UiAction> },
    ]} rows={[{ id: 'fixture-public-identifier-that-is-longer-than-a-phone-column', name: 'A record with a real-length descriptive name' }]} rowKey="id" />
    <UiSection title="Reference directory"><UiReferenceList label="Example directory" items={references} getItemKey={entry => entry.name} renderEntry={entry => <UiReferenceEntry {...entry} icon={<UiIcon name="info" />} />} /></UiSection>
    <UiSection title="Setup picker"><UiReferenceList label="Example picker" variant="picker" items={references} getItemKey={entry => entry.name} renderEntry={entry => <UiReferenceEntry {...entry} icon={<UiIcon name="info" />} actions={<UiAction iconOnly aria-label="Add example reference"><UiIcon name="add" /></UiAction>} />} /></UiSection>
  </UiPage>;
}
