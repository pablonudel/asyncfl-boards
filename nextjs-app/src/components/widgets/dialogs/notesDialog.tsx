"use client"

import {
	createNotesWidget,
	updateNotesWidget,
} from "@/actions/widgets/crudWidgets.actions"
import { JsonValue } from "@prisma/client/runtime/client"
import { Editor, EditorContent, useEditor } from "@tiptap/react"
import { useCallback, useState } from "react"
import { RichTextProvider } from "reactjs-tiptap-editor"
import { Image } from "reactjs-tiptap-editor/image"
import { toast } from "sonner"

// Base Kit
import { Document } from "@tiptap/extension-document"
import { HardBreak } from "@tiptap/extension-hard-break"
import { ListItem } from "@tiptap/extension-list"
import { Paragraph } from "@tiptap/extension-paragraph"
import { Text } from "@tiptap/extension-text"
import { TextStyle } from "@tiptap/extension-text-style"
import { Dropcursor, Gapcursor, TrailingNode } from "@tiptap/extensions"
import {
	History,
	RichTextRedo,
	RichTextUndo,
} from "reactjs-tiptap-editor/history"

export interface IProviderRichTextProps {
	editor: Editor | null
	dark: boolean
}

// Extension
import { Bold, RichTextBold } from "reactjs-tiptap-editor/bold"
import { Callout, RichTextCallout } from "reactjs-tiptap-editor/callout"
import {
	FontFamily,
	RichTextFontFamily,
} from "reactjs-tiptap-editor/fontfamily"
import { FontSize, RichTextFontSize } from "reactjs-tiptap-editor/fontsize"
import { Heading, RichTextHeading } from "reactjs-tiptap-editor/heading"
import { Indent, RichTextIndent } from "reactjs-tiptap-editor/indent"
import { Italic, RichTextItalic } from "reactjs-tiptap-editor/italic"
import { Katex, RichTextKatex } from "reactjs-tiptap-editor/katex"
import {
	LineHeight,
	RichTextLineHeight,
} from "reactjs-tiptap-editor/lineheight"
import { Link, RichTextLink } from "reactjs-tiptap-editor/link"
import {
	OrderedList,
	RichTextOrderedList,
} from "reactjs-tiptap-editor/orderedlist"
import { RichTextStrike, Strike } from "reactjs-tiptap-editor/strike"
import { RichTextTable, Table } from "reactjs-tiptap-editor/table"
import { RichTextTaskList, TaskList } from "reactjs-tiptap-editor/tasklist"
import { RichTextAlign, TextAlign } from "reactjs-tiptap-editor/textalign"
import {
	RichTextUnderline,
	TextUnderline,
} from "reactjs-tiptap-editor/textunderline"
// Slash Command
import {
	SlashCommand,
	SlashCommandList,
} from "reactjs-tiptap-editor/slashcommand"

const extensions = [
	// Base Extensions
	Document,
	Text,
	Dropcursor,
	Gapcursor,
	HardBreak,
	Paragraph,
	TrailingNode,
	ListItem,
	TextStyle,
	Heading,
	FontSize,
	History,
	FontFamily,
	Indent,
	Italic,
	Link,
	OrderedList,
	Strike,
	Table,
	Bold,
	Katex,
	LineHeight,
	TaskList,
	TextAlign,
	TextUnderline,
	Callout,

	// Slash Command Extension
	SlashCommand,
	// Placeholder.configure({
	// 	placeholder: "Press '/' for commands",
	// }),
	Image,
]

// Import CSS
import "katex/dist/katex.min.css"
import "reactjs-tiptap-editor/style.css"

function debounce(func: any, wait: number) {
	let timeout: NodeJS.Timeout
	return function (...args: any[]) {
		clearTimeout(timeout)
		// @ts-ignore
		timeout = setTimeout(() => func.apply(this, args), wait)
	}
}

const RichTextToolbar = () => {
	return (
		<div className='flex items-center !p-1 gap-2 flex-wrap !border-b !border-solid border-gray-300'>
			<RichTextUndo />
			<RichTextRedo />
			<RichTextHeading />
			<RichTextFontSize />
			<RichTextFontFamily />
			<RichTextLineHeight />
			<RichTextAlign />
			<RichTextBold />
			<RichTextItalic />
			<RichTextUnderline />
			<RichTextStrike />
			<RichTextLink />
			<RichTextOrderedList />
			<RichTextTaskList />
			<RichTextCallout />
			<RichTextKatex />
			<RichTextIndent />
			<RichTextTable />
		</div>
	)
}

export default function NotesDialog({
	projectId,
	widgetConfig,
	widgetId,
	setIsDialogOpen,
	mode,
}: {
	projectId: string
	widgetConfig?: JsonValue
	widgetId?: string
	setIsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
	mode: string
}) {
	const widgetContent =
		JSON.parse(JSON.stringify(widgetConfig || "{}")).content ?? null
	const [content, setContent] = useState<string | null>(widgetContent)

	const onValueChange = useCallback(
		debounce((value: any) => {
			setContent(value)
		}, 300),
		[],
	)

	const editor = useEditor({
		textDirection: "auto", // global text direction
		extensions,
		immediatelyRender: false,
		content,
		onUpdate: ({ editor }) => {
			const html = editor.getHTML()
			onValueChange(html)
		},
	})

	if (!editor) {
		return null
	}

	async function onSubmit(e: React.FormEvent, content: string) {
		e.preventDefault()
		if (mode === "create") {
			try {
				const res = await createNotesWidget(projectId, content)
				if (!res.success) {
					toast.error(res.message)
					return
				}
				setIsDialogOpen(false)
				toast.success(res.message)
			} catch (error) {
				console.error("Error creating notes widget:", error)
				toast.error("Failed to create notes widget. Please try again.")
			}
		} else if (mode === "edit" && widgetId) {
			try {
				const res = await updateNotesWidget(widgetId, projectId, content)
				if (!res.success) {
					toast.error(res.message)
					return
				}
				setIsDialogOpen(false)
				toast.success(res.message)
			} catch (error) {
				console.error("Error updating notes widget:", error)
				toast.error("Failed to update notes widget. Please try again.")
			}
		}
	}

	return (
		<>
			<RichTextProvider editor={editor}>
				<div className='overflow-hidden rounded-md bg-background !border border-gray-300'>
					<RichTextToolbar />
					<EditorContent editor={editor} />
					<SlashCommandList />
				</div>
			</RichTextProvider>

			<form id='notes-form' onSubmit={(e) => onSubmit(e, content || "")}>
				<input type='hidden' name='content' value={content || ""} readOnly />
			</form>
		</>
	)
}
