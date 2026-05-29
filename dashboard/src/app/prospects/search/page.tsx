import { Suspense } from "react";
import { ProspectSearchContent } from "./SearchContent";

export default function ProspectSearchPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-gray-500">Loading...</div>
      }
    >
      <ProspectSearchContent />
    </Suspense>
  );
}
