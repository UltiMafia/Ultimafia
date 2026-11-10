// No page-specific CSS, styles or MUI imports. A new page should get usable
// geometry by composing the supported primitives alone.
import React from 'react';
import { UiPage, UiSection, UiField, UiAction, UiCard, UiIcon } from '../../src/components/ui';

export default function NewPageFixture() {
  return <UiPage width="reading" title="Example page" description="Shared page geometry" actions={<UiAction variant="primary"><UiIcon name="add" />Create item</UiAction>}>
    <UiSection title="Details"><UiField fullWidth label="Name" defaultValue="Example item" /><UiAction>Save details</UiAction></UiSection>
    <UiCard><UiSection title="Preview"><p>Content is composed without a second page header or custom control CSS.</p></UiSection></UiCard>
  </UiPage>;
}
