
import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Column } from '../lib/database.types';
import { useBoard } from './BoardContext';
import { CardComponent } from './Card';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Grip, MoreHorizontal, PlusCircle, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

interface ColumnProps {
  column: Column & { cards: any[] };
  index: number;
  isDragging?: boolean;
}

export function ColumnComponent({ column, index, isDragging = false }: ColumnProps) {
  const { createCard, updateColumn, deleteColumn } = useBoard();
  const [isAddCardDialogOpen, setIsAddCardDialogOpen] = useState(false);
  const [isEditColumnDialogOpen, setIsEditColumnDialogOpen] = useState(false);
  const [cardTitle, setCardTitle] = useState('');
  const [columnTitle, setColumnTitle] = useState(column.title);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: 'column',
      index,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  const handleAddCard = async () => {
    if (!cardTitle.trim()) return;
    
    await createCard(cardTitle, column.id);
    setCardTitle('');
    setIsAddCardDialogOpen(false);
  };

  const handleUpdateColumn = async () => {
    if (!columnTitle.trim()) return;
    
    await updateColumn(column.id, { title: columnTitle });
    setIsEditColumnDialogOpen(false);
  };

  const handleDeleteColumn = async () => {
    await deleteColumn(column.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex-shrink-0 w-80 ${isDragging || isSortableDragging ? 'z-10' : ''}`}
    >
      <Card className="h-full flex flex-col bg-card/50 border shadow-sm">
        <CardHeader className="p-3 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2 w-full">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab p-1 rounded hover:bg-secondary"
            >
              <Grip size={16} className="text-muted-foreground" />
            </div>
            <h3 className="font-medium text-sm flex-1 truncate">{column.title}</h3>
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
              {column.cards.length}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditColumnDialogOpen(true)}>
                  Edit Column
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={handleDeleteColumn}
                >
                  Delete Column
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0 flex-1 overflow-y-auto max-h-[calc(100vh-13rem)]">
          <SortableContext
            items={column.cards.map(card => card.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-2">
              {column.cards.map((card, cardIndex) => (
                <CardComponent
                  key={card.id}
                  card={card}
                  index={cardIndex}
                  columnId={column.id}
                />
              ))}
            </div>
          </SortableContext>
        </CardContent>
        <div className="p-3 pt-0">
          <Dialog open={isAddCardDialogOpen} onOpenChange={setIsAddCardDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground hover:text-foreground"
              >
                <PlusCircle size={16} className="mr-2" />
                Add a card
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a new card</DialogTitle>
                <DialogDescription>
                  Enter a title for your new card.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="cardTitle">Title</Label>
                  <Input
                    id="cardTitle"
                    value={cardTitle}
                    onChange={(e) => setCardTitle(e.target.value)}
                    placeholder="Enter card title"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddCardDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddCard}>Add Card</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </Card>

      <Dialog open={isEditColumnDialogOpen} onOpenChange={setIsEditColumnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit column</DialogTitle>
            <DialogDescription>
              Update the title of your column.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="columnTitle">Title</Label>
              <Input
                id="columnTitle"
                value={columnTitle}
                onChange={(e) => setColumnTitle(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditColumnDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateColumn}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}