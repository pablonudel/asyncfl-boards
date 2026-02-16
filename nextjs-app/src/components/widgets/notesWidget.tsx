"use client"

import { JsonValue } from "@prisma/client/runtime/client"
import { Editor, EditorContent, useEditor } from "@tiptap/react"
import { useEffect } from "react"
import { Image } from "reactjs-tiptap-editor/image"

// Base Kit
import { Document } from "@tiptap/extension-document"
import { HardBreak } from "@tiptap/extension-hard-break"
import { ListItem } from "@tiptap/extension-list"
import { Paragraph } from "@tiptap/extension-paragraph"
import { Text } from "@tiptap/extension-text"
import { TextStyle } from "@tiptap/extension-text-style"
import { Dropcursor, Gapcursor, TrailingNode } from "@tiptap/extensions"
import { History } from "reactjs-tiptap-editor/history"

// Extension
import { Bold } from "reactjs-tiptap-editor/bold"
import { Callout } from "reactjs-tiptap-editor/callout"
import { Color } from "reactjs-tiptap-editor/color"
import { FontFamily } from "reactjs-tiptap-editor/fontfamily"
import { FontSize } from "reactjs-tiptap-editor/fontsize"
import { Heading } from "reactjs-tiptap-editor/heading"
import { Highlight } from "reactjs-tiptap-editor/highlight"
import { HorizontalRule } from "reactjs-tiptap-editor/horizontalrule"
import { Indent } from "reactjs-tiptap-editor/indent"
import { Italic } from "reactjs-tiptap-editor/italic"
import { Katex } from "reactjs-tiptap-editor/katex"
import { LineHeight } from "reactjs-tiptap-editor/lineheight"
import { Link } from "reactjs-tiptap-editor/link"
import { OrderedList } from "reactjs-tiptap-editor/orderedlist"
import { Strike } from "reactjs-tiptap-editor/strike"
import { Table } from "reactjs-tiptap-editor/table"
import { TaskList } from "reactjs-tiptap-editor/tasklist"
import { TextAlign } from "reactjs-tiptap-editor/textalign"
import { TextUnderline } from "reactjs-tiptap-editor/textunderline"

export interface IProviderRichTextProps {
	editor: Editor | null
	dark: boolean
}

const extensions = [
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
	Dropcursor,
	Gapcursor,
	TrailingNode,
	Image,
	Color,
	HorizontalRule,
	Highlight,
]

import "katex/dist/katex.min.css"
import { useMemo } from "react"
import "reactjs-tiptap-editor/style.css"

export default function NotesWidget({
	widgetConfig,
}: {
	widgetConfig?: JsonValue
}) {
	// Hacer que el contenido sea estable - solo cambiar si realmente cambió
	const configStr = useMemo(() => {
		try {
			return JSON.stringify(widgetConfig)
		} catch {
			return "{}"
		}
	}, [widgetConfig])

	const widgetContent = useMemo(() => {
		return JSON.parse(JSON.stringify(widgetConfig || "{}")).content ?? null
	}, [configStr])

	const editor = useEditor({
		textDirection: "auto", // global text direction
		extensions,
		immediatelyRender: false,
		content: widgetContent,
		editable: false,
	})

	useEffect(() => {
		if (!editor) return
		const current = editor.getHTML()
		if (current === widgetContent) return

		const id = setTimeout(() => {
			if (editor.isDestroyed) return
			editor.commands.setContent(widgetContent)
		}, 0)

		return () => clearTimeout(id)
	}, [editor, widgetContent])

	if (!editor) {
		return null
	}

	return (
		<div className='py-8'>
			<EditorContent editor={editor} />
		</div>
	)
}
