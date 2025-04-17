
import { useState, useEffect } from 'react';
import { useBoard } from './BoardContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tag } from '../lib/database.types';
import { Trash2 } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';

interface BoardSettingsProps {
  boardId: string;
  onClose: () => void;
}

export function BoardSettings({ boardId, onClose }: BoardSettingsProps) {
  const { createTag, updateTag, deleteTag, currentBoard } = useBoard();
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState('#3b82f6');
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    // Extract all unique tags from the current board
    if (currentBoard) {
      const uniqueTags: Tag[] = [];
      const tagIds = new Set<string>();
      
      currentBoard.columns.forEach(column => {
        column.cards.forEach(card => {
          card.tags.forEach(tag => {
            if (!tagIds.has(tag.id)) {
              tagIds.add(tag.id);
              uniqueTags.push(tag);
            }
          });
        });
      });
      
      setTags(uniqueTags);
    }
  }, [currentBoard]);

  const handleCreateTag = async () => {
    if (!tagName.trim()) return;
    
    const tagId = await createTag(tagName, tagColor, boardId);
    if (tagId) {
      setTags([...tags, { id: tagId, name: tagName, color: tagColor, board_id: boardId, created_at: new Date().toISOString() }]);
      setTagName('');
      setTagColor(getRandomColor());
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    await deleteTag(tagId);
    setTags(tags.filter(tag => tag.id !== tagId));
  };

  return (
    <div className="space-y-6 py-4">
      <div>
        <h3 className="text-lg font-medium">Tags</h3>
        <p className="text-sm text-muted-foreground">
          Create and manage tags for your cards.
        </p>
      </div>
      
      <div className="grid gap-4">
        <div className="flex items-end gap-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor="tagName">Tag Name</Label>
            <Input
              id="tagName"
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              placeholder="Enter tag name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tagColor">Color</Label>
            <Input
              id="tagColor"
              type="color"
              value={tagColor}
              onChange={(e) => setTagColor(e.target.value)}
              className="w-16 h-10 p-1"
            />
          </div>
          <Button onClick={handleCreateTag}>Add Tag</Button>
        </div>
      </div>
      
      <Separator />
      
      <div>
        <h4 className="text-sm font-medium mb-3">Existing Tags</h4>
        <ScrollArea className="h-[200px] pr-4">
          {tags.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              No tags created yet. Add your first tag above.
            </p>
          ) : (
            <div className="space-y-2">
              {tags.map(tag => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between p-2 rounded bg-secondary/50"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span>{tag.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteTag(tag.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
      
      <div className="flex justify-end">
        <Button onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}

// Helper function to generate a random color
function getRandomColor(): string {
  const colors = [
    '#ef4444', // red
    '#f97316', // orange
    '#f59e0b', // amber
    '#eab308', // yellow
    '#84cc16', // lime
    '#22c55e', // green
    '#10b981', // emerald
    '#14b8a6', // teal
    '#06b6d4', // cyan
    '#0ea5e9', // sky
    '#3b82f6', // blue
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#a855f7', // purple
    '#d946ef', // fuchsia
    '#ec4899', // pink
    '#f43f5e', // rose
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
}