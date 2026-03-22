import type * as React from "react";

import {
  CreateProjectFormCard,
  CreateProjectNextStepsCard,
} from "@/features/projects/components/project-operation-cards";
import type { ProjectType } from "@/features/projects/types";
import { cn } from "@/lib/utils";

export interface CreateProjectSectionProps
  extends React.HTMLAttributes<HTMLDivElement> {
  action?: (formData: FormData) => void | Promise<void>;
  defaultType?: ProjectType;
  errorMessage?: string;
}

export function CreateProjectSection({
  action,
  className,
  defaultType = "team",
  errorMessage,
  ...props
}: CreateProjectSectionProps) {
  return (
    <section className={cn("flex w-full flex-col", className)} {...props}>
      <div className="grid gap-6 xl:grid-cols-[728px_392px]">
        <CreateProjectFormCard
          action={action}
          defaultType={defaultType}
          errorMessage={errorMessage}
        />
        <CreateProjectNextStepsCard projectType={defaultType} />
      </div>
    </section>
  );
}
