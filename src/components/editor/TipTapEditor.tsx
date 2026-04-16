'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { Box, Button } from '@mui/material';

type Props = {
  value: string;
  onChange: (value: string) => void;
  onFocusEditor?: (editor: any) => void;
  showToolbar?: boolean;
};

export default function TipTapEditor({ value, onChange, onFocusEditor, showToolbar = true }: Props) {
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: value || '',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onFocus: ({ editor }) => {
      onFocusEditor?.(editor);
    }
  });

  if (!editor) return null;

  return (
    <Box>
      {showToolbar && (
        <Box sx={{ mb: 1, display: 'flex', gap: 1 }}>
            <Button onClick={() => editor.chain().focus().toggleBold().run()}>
            B
            </Button>
            <Button onClick={() => editor.chain().focus().toggleItalic().run()}>
            I
            </Button>
            <Button onClick={() => editor.chain().focus().toggleUnderline().run()}>
            U
            </Button>
        </Box>
        )}

      {/* Editor */}
      <Box
        sx={{
          border: '1px solid #ccc',
          borderRadius: 1,
          padding: 1,
          minHeight: 120,
        }}
      >
        <EditorContent editor={editor} />
      </Box>
    </Box>
  );
}