
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBoard } from './BoardContext';
import { ColumnComponent } from './Column';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { ArrowLeft, PlusCircle, Settings } from 'lucide-react';
import { Card } from './ui/card';
import { CardComponent } from './Card';
import { DragEndEvent } from '../lib/dnd-types';
import { BoardSettings } from './BoardSettings';

export function BoardView() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const { currentBoard, isLoading, fetchBoardDetails, createColumn, updateBoard, handleDragEnd } = useBoard();
  const [isAddColumnDialogOpen, setIsAddColumnDialogOpen] = useState(false);
  const [isEditBoardDialogOpen, setIsEditBoardDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [columnTitle, setColumnTitle] = useState('');
  const [boardTitle, setBoardTitle] = useState('');
  const [boardDescription, setBoardDescription] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<'column' | 'card' | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    if (boardId) {
      fetchBoardDetails(boardId);
    }
  }, [boardId, fetchBoardDetails]);

  useEffect(() => {
    if (currentBoard) {
      setBoardTitle(currentBoard.title);
      setBoardDescription(currentBoard.description || '');
    }
  }, [currentBoard]);

  const handleAddColumn = async () => {
    if (!columnTitle.trim() || !boardId) return;
    
    await createColumn(columnTitle, boardId);
    setColumnTitle('');
    setIsAddColumnDialogOpen(false);
  };

  const handleUpdateBoard = async () => {
    if (!boardTitle.trim() || !boardId) return;
    
    await updateBoard(boardId, {
      title: boardTitle,
      description: boardDescription || null,
    });
    setIsEditBoardDialogOpen(false);
  };

  const handleDragStart = (event: any) => {
    const { active } = event;
    setActiveId(active.id);
    setActiveType(active.data.current.type);
  };

  const handleDragEnd = async (event: any) => {
    setActiveId(null);
    setActiveType(null);
    await handleDragEnd(event as DragEndEvent);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentBoard) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Board not found</h1>
        <Button onClick={() => navigate('/')}>Back to Boards</Button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-card border-b p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{currentBoard.title}</h1>
            {currentBoard.description && (
              <p className="text-sm text-muted-foreground">{currentBoard.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isEditBoardDialogOpen} onOpenChange={setIsEditBoardDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Edit Board</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Board</DialogTitle>
                <DialogDescription>
                  Update the title and description of your board.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="boardTitle">Title</Label>
                  <Input
                    id="boardTitle"
                    value={boardTitle}
                    onChange={(e) => setBoardTitle(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="boardDescription">Description (optional)</Label>
                  <Textarea
                    id="boardDescription"
                    value={boardDescription}
                    onChange={(e) => setBoardDescription(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditBoardDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateBoard}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings size={20} />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Board Settings</DialogTitle>
                <DialogDescription>
                  Manage tags and other settings for this board.
                </DialogDescription>
              </DialogHeader>
              <BoardSettings boardId={boardId!} onClose={() => setIsSettingsDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="flex-1 overflow-x-auto p-6 bg-background">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 h-full">
            <SortableContext
              items={currentBoard.columns.map(column => column.id)}
              strategy={horizontalListSortingStrategy}
            >
              {currentBoard.columns.map((column, index) => (
                <ColumnComponent
                  key={column.id}
                  column={column}
                  index={index}
                />
              ))}
            </SortableContext>

            <Dialog open={isAddColumnDialogOpen} onOpenChange={setIsAddColumnDialogOpen}>
              <DialogTrigger asChild>
                <div className="flex-shrink-0 w-80">
                  <Button
                    variant="outline"
                    className="w-full h-12 border-dashed flex items-center justify-center gap-2"
                  >
                    <PlusCircle size={18} />
                    <span>Add Column</span>
                  </Button>
                </div>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add a new column</DialogTitle>
                  <DialogDescription>
                    Enter a title for your new column.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="columnTitle">Title</Label>
                    <Input
                      id="columnTitle"
                      value={columnTitle}
                      onChange={(e) => setColumnTitle(e.target.value)}
                      placeholder="Enter column title"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddColumnDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddColumn}>Add Column</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <DragOverlay>
              {activeId && activeType === 'column' && (
                <div className="w-80 opacity-80">
                  {currentBoard.columns.find(col => col.id === activeId) && (
                    <ColumnComponent
                      column={currentBoard.columns.find(col => col.id === activeId)!}
                      index={currentBoard.columns.findIndex(col => col.id === activeId)}
                      isDragging
                    />
                  )}
                </div>
              )}
              {activeId && activeType === 'card' && (
                <div className="w-72 opacity-80">
                  {currentBoard.columns.map(col => 
                    col.cards.find(card => card.id === activeId)
                  ).filter(Boolean)[0] && (
                    <Card className="p-3 shadow-md">
                      <CardComponent
                        card={currentBoard.columns.map(col => 
                          col.cards.find(card => card.id === activeId)
                        ).filter(Boolean)[0]!}
                        isDragging
                      />
                    </Card>
                  )}
                </div>
              )}
            </DragOverlay>
          </div>
        </DndContext>
      </div>
    </div>
  );
}