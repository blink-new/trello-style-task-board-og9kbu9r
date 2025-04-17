
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBoard } from './BoardContext';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { PlusCircle, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function BoardList() {
  const { boards, createBoard, deleteBoard } = useBoard();
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleCreateBoard = async () => {
    if (!title.trim()) return;
    
    const boardId = await createBoard(title, description);
    if (boardId) {
      setTitle('');
      setDescription('');
      setIsDialogOpen(false);
      navigate(`/board/${boardId}`);
    }
  };

  const handleDeleteBoard = async (e: React.MouseEvent, boardId: string) => {
    e.stopPropagation();
    await deleteBoard(boardId);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Boards</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <PlusCircle size={18} />
              <span>New Board</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a new board</DialogTitle>
              <DialogDescription>
                Add a title and optional description for your new board.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter board title"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter board description"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateBoard}>Create Board</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {boards.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-medium text-muted-foreground mb-4">
            You don't have any boards yet
          </h2>
          <Button onClick={() => setIsDialogOpen(true)}>Create your first board</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boards.map((board) => (
            <Card
              key={board.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/board/${board.id}`)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{board.title}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={(e) => handleDeleteBoard(e, board.id)}
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
                {board.description && (
                  <CardDescription>{board.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Created {formatDistanceToNow(new Date(board.created_at), { addSuffix: true })}
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => navigate(`/board/${board.id}`)}>
                  Open Board
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}