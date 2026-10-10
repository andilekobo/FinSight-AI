import { PageHeading } from "../components/ui/Primitives";
import { AssistantChat } from "../components/ai/AssistantChat";

export function AssistantPage() {
  return (
    <>
      <PageHeading eyebrow="YOUR FINANCIAL COPILOT" title="AI Assistant" description="Ask questions about usage, billing, and business finances." />
      <AssistantChat />
    </>
  );
}
