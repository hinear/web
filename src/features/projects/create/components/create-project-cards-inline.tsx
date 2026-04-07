"use client";

import { useState } from "react";

import { Button } from "@/components/atoms/Button";
import { Field } from "@/components/atoms/Field";
import type { ProjectType } from "@/features/projects/types";

import { ProjectTypeOption } from "./project-type-option";

interface CreateProjectFormCardProps {
  action?: (formData: FormData) => void | Promise<void>;
  defaultType?: ProjectType;
  errorMessage?: string;
}

interface CreateProjectNextStepsCardProps {
  projectType?: ProjectType;
}

export function CreateProjectFormCard({
  action,
  defaultType = "personal",
  errorMessage,
}: CreateProjectFormCardProps) {
  const [selectedType, setSelectedType] = useState<ProjectType>(defaultType);
  const content = (
    <>
      <h2 className="text-[18px] font-bold text-[#111318]">Project details</h2>

      {errorMessage ? (
        <div className="rounded-[12px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] leading-5 font-medium text-[#B91C1C]">
          {errorMessage}
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <label
          htmlFor="project-name"
          className="text-[13px] font-semibold text-[#111318]"
        >
          Project name
        </label>
        <Field
          className="h-auto min-h-[46px] rounded-[12px] border-[#E6E8EC] bg-[#FCFCFD] px-[14px] py-3 font-medium text-[#111318] placeholder:font-medium placeholder:text-[#8A90A2]"
          id="project-name"
          name="name"
          placeholder="Hinear Web App"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="project-key"
          className="text-[13px] font-semibold text-[#111318]"
        >
          Project key
        </label>
        <Field
          className="h-auto min-h-[46px] max-w-[180px] rounded-[12px] border-[#E6E8EC] bg-[#FCFCFD] px-[14px] py-3 font-bold text-[#111318] placeholder:font-medium placeholder:text-[#8A90A2]"
          id="project-key"
          name="key"
          placeholder="HIN"
          required
          aria-invalid={errorMessage ? true : undefined}
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-[13px] font-semibold text-[#111318]">
          Project type
        </legend>
        <div
          aria-label="Project type"
          className="grid gap-3 md:grid-cols-2"
          role="radiogroup"
        >
          <ProjectTypeOption
            checked={selectedType === "personal"}
            description="Use this when you are working alone. Invitations stay hidden and settings remain simpler."
            onChange={setSelectedType}
            title="Personal"
            value="personal"
          />
          <ProjectTypeOption
            checked={selectedType === "team"}
            description="Use this when you want owners, members, invitations, and shared issue ownership from the start."
            onChange={setSelectedType}
            title="Team"
            value="team"
          />
        </div>
      </fieldset>

      <div className="flex flex-col gap-3 pt-1 md:flex-row md:items-center md:justify-between">
        <p className="max-w-[420px] text-[13px] font-medium leading-5 text-[#4B5563]">
          After creation, land on the board and continue with issue setup.
        </p>
        <Button
          className="min-h-[46px] w-full justify-center rounded-[12px] bg-[#5E6AD2] px-4 py-3 text-[14px] font-bold md:w-auto"
          type="submit"
        >
          Create project
        </Button>
      </div>
    </>
  );

  return (
    <section className="rounded-[24px] border border-[#E6E8EC] bg-white p-6">
      {action ? (
        <form action={action} className="flex flex-col gap-[18px]">
          {content}
        </form>
      ) : (
        <div className="flex flex-col gap-[18px]">{content}</div>
      )}
    </section>
  );
}

export function CreateProjectNextStepsCard({
  projectType = "team",
}: CreateProjectNextStepsCardProps) {
  return (
    <aside className="rounded-[24px] border border-[#E6E8EC] bg-white p-6">
      <h2 className="text-[18px] font-bold text-[#111318]">
        What happens next
      </h2>
      <ol className="mt-4 flex list-decimal flex-col gap-4 pl-5 text-[14px] font-semibold leading-6 text-[#111318]">
        <li>Redirect to the project board</li>
        <li>Create your first issue and open detail</li>
        <li>
          {projectType === "team"
            ? "If this is a team project, invite members from Settings"
            : "Keep setup lightweight and move directly into issue triage"}
        </li>
      </ol>
    </aside>
  );
}
