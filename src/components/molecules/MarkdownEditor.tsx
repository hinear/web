"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import { cn } from "@/lib/utils";
import "./MarkdownEditor.css";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  CheckSquare,
  Code,
  Heading2,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Strikethrough,
} from "lucide-react";
import * as React from "react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "입력해주세요...",
  className,
  minHeight = "160px",
}: MarkdownEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-[#4338CA] underline",
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none focus:outline-none",
          "min-h-[160px] px-4 py-3",
          "text-[13px] leading-[1.55] text-[#111318]"
        ),
      },
    },
  });

  React.useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  const ToolbarButton = ({
    onClick,
    isActive,
    children,
    title,
  }: {
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "rounded px-2 py-1 text-[#6B7280] transition-colors hover:bg-[#F3F4F6] hover:text-[#111318]",
        isActive && "bg-[#EEF2FF] text-[#4338CA]"
      )}
    >
      {children}
    </button>
  );

  return (
    <div
      className={cn(
        "flex flex-col rounded-[12px] border border-[#E6E8EC] bg-[#FCFCFD]",
        className
      )}
      style={{ minHeight }}
    >
      <div className="flex flex-wrap items-center gap-1 border-b border-[#E6E8EC] px-2 py-1">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          title="Bold (Cmd+B)"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          title="Italic (Cmd+I)"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive("strike")}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive("code")}
          title="Code"
        >
          <Code className="h-4 w-4" />
        </ToolbarButton>
        <div className="mx-1 h-4 w-px bg-[#E6E8EC]" />
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          isActive={editor.isActive("heading", { level: 2 })}
          title="Heading"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          isActive={editor.isActive("taskList")}
          title="Task List"
        >
          <CheckSquare className="h-4 w-4" />
        </ToolbarButton>
        <div className="mx-1 h-4 w-px bg-[#E6E8EC]" />
        <ToolbarButton
          onClick={() => {
            const url = window.prompt("링크 URL을 입력하세요:");
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          isActive={editor.isActive("link")}
          title="Link"
        >
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
      </div>
      <div suppressHydrationWarning>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
