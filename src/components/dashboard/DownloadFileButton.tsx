import { Download } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Download control for a file/image item. Renders as an anchor to the
 * owner-scoped download proxy (`/api/items/[id]/download`), which serves the R2
 * object same-origin with an attachment disposition — so it downloads with the
 * original filename and sidesteps cross-origin (CORS) issues.
 */
export function DownloadFileButton({
  itemId,
  className,
}: {
  itemId: string;
  className?: string;
}) {
  return (
    <a
      href={`/api/items/${itemId}/download`}
      className={cn(buttonVariants({ variant: "outline", size: "sm" }), className)}
    >
      <Download />
      Download
    </a>
  );
}
