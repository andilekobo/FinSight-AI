import { PageHeading } from "../components/ui/Primitives";
import { AssistantChat } from "../components/ai/AssistantChat";

export function AssistantPage() {
  return (
    <>
      <PageHeading eyebrow="YOUR FINANCIAL COPILOT" title="AI Assistant" description="Get a clearer view of your spending, transactions, and cash flow." />
      <AssistantChat />
    </>
  );
}
