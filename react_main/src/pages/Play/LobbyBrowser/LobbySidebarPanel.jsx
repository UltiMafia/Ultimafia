import { UiSection } from "components/ui";

export default function LobbySidebarPanel({ children, title, className = "" }) {
  return (
    <UiSection title={title} className={`ui-card lobby-feature-section ${className}`}>
      {children}
    </UiSection>
  );
}
