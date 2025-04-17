
import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card as CardType, Tag } from '../lib/database.types';
import { useBoard } from './BoardContext';
import { Card } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Check, MoreHorizontal, Tag as TagIcon, Trash2 } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

interface CardProps {
  card: CardType & { tags: Tag[] };
  index: number;
  columnId?: string;
  isDragging?: boolean;
}

export function CardComponent({ card, index, columnId, isDragging = false }: CardProps) {
  const { updateCard, deleteCard, addTagToCard, removeTagFromCard, currentBoard } = useBoard();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: 'card',
      columnId,
      index,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  const handleUpdateCard = async () => {
    if (!title.trim()) return;
    
    await updateCard(card.id, {
      title,
      description: description || null,
    });
    setIsEditDialogOpen(false);
  };

  const handleDeleteCard = async () => {
    await deleteCard(card.id);
  };

  const handleTagToggle = async (tagId: string) => {
    const hasTag = card.tags.some(tag => tag.id === tagId);
    
    if (hasTag) {
      await removeTagFromCard(card.id, tagId);
    } else {
      await addTagToCard(card.id, tagId);
    }
  };

  // Get all available tags for the current board
  const availableTags: Tag[] = [];
  if (currentBoard) {
    currentBoard.columns.forEach(column => {
      column.cards.forEach(c => {
        c.tags.forEach(tag => {
          if (!availableTags.some(t => t.id === tag.id)) {
            availableTags.push(tag);
          }
        });
      });
    });
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`${isDragging || isSortableDragging ? 'z-10' : ''}`}
      >
        <Card className="p-3 cursor-grab bg-card shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start gap-2">
            <h4 className="text-sm font-medium">{card.title}</h4>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                  Edit Card
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsTagDialogOpen(true)}>
                  Manage Tags
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={handleDeleteCard}
                >
                  Delete Card
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {card.description && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-3">
              {card.description}
            </p>
          )}
          
          {card.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {card.tags.map(tag => (
                <Badge
                  key={tag.id}
                  style={{ backgroundColor: tag.color, color: getContrastColor(tag.color) }}
                  className="text-xs px-2 py-0.5"
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit card</DialogTitle>
            <DialogDescription>
              Update the details of your card.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCard}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Tags</DialogTitle>
            <DialogDescription>
              Add or remove tags from this card.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[300px] pr-4">
            <div className="space-y-2 py-2">
              {availableTags.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No tags available. Create tags in the board settings.
                </p>
              ) : (
                availableTags.map(tag => {
                  const isSelected = card.tags.some(t => t.id === tag.id);
                  return (
                    <div
                      key={tag.id}
                      className="flex items-center justify-between p-2 rounded hover:bg-secondary cursor-pointer"
                      onClick={() => handleTagToggle(tag.id)}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span>{tag.name}</span>
                      </div>
                      {isSelected && <Check size={16} className="text-primary" />}
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTagDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Helper function to determine text color based on background color
function getContrastColor(hexColor: string): string {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black or white based on luminance
  return luminance > 0.5 ? '#000000' : '#ffffff';
}