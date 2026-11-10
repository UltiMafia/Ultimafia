// No page-specific CSS, styles or MUI imports. A new page should get usable
// geometry by composing the supported primitives alone.
import React from 'react';
import { UiPage, UiSection, UiField, UiMenuItem, UiAction, UiCard, UiIcon, UiTable } from '../../src/components/ui';

export default function NewPageFixture() {
  return <UiPage width="reading" title="Example page" description="Shared page geometry" actions={<UiAction variant="primary"><UiIcon name="add" />Create item</UiAction>}>
    <UiSection title="Details"><UiField fullWidth label="Name" defaultValue="Example item" /><UiField select fullWidth label="Record status" defaultValue="active"><UiMenuItem value="active">Active</UiMenuItem></UiField><UiAction>Save details</UiAction></UiSection>
    <UiCard><UiSection title="Preview"><p>Content is composed without a second page header or custom control CSS.</p></UiSection></UiCard>
    <UiTable label="Example records" columns={[
      { key: 'name', label: 'Name' }, { key: 'id', label: 'Public ID', code: true },
      { key: 'actions', label: 'Actions', render: () => <UiAction>Review record</UiAction> },
    ]} rows={[{ id: 'fixture-public-identifier-that-is-longer-than-a-phone-column', name: 'A record with a real-length descriptive name' }]} rowKey="id" />
  </UiPage>;
}
