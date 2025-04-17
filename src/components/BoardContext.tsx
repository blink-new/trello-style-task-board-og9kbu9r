
import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { BoardWithColumns, Board, Column, Card, Tag } from '../lib/database.types';
import { DragEndEvent } from '../lib/dnd-types';
import { useToast } from '../hooks/use-toast';

type BoardContextType = {
  boards: Board[];
  currentBoard: BoardWithColumns | null;
  isLoading: boolean;
  fetchBoards: () => Promise<void>;
  fetchBoardDetails: (boardId: string) => Promise<void>;
  createBoard: (title: string, description?: string) => Promise<string | null>;
  updateBoard: (id: string, updates: Partial<Board>) => Promise<void>;
  deleteBoard: (id: string) => Promise<void>;
  createColumn: (title: string, boardId: string) => Promise<void>;
  updateColumn: (id: string, updates: Partial<Column>) => Promise<void>;
  deleteColumn: (id: string) => Promise<void>;
  createCard: (title: string, columnId: string) => Promise<void>;
  updateCard: (id: string, updates: Partial<Card>) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  createTag: (name: string, color: string, boardId: string) => Promise<string | null>;
  updateTag: (id: string, updates: Partial<Tag>) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  addTagToCard: (cardId: string, tagId: string) => Promise<void>;
  removeTagFromCard: (cardId: string, tagId: string) => Promise<void>;
  handleDragEnd: (event: DragEndEvent) => Promise<void>;
};

const BoardContext = createContext<BoardContextType | undefined>(undefined);

export function BoardProvider({ children }: { children: ReactNode }) {
  const [boards, setBoards] = useState<Board[]>([]);
  const [currentBoard, setCurrentBoard] = useState<BoardWithColumns | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchBoards = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBoards(data || []);
    } catch (error) {
      console.error('Error fetching boards:', error);
      toast({
        title: 'Error fetching boards',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchBoardDetails = useCallback(async (boardId: string) => {
    setIsLoading(true);
    try {
      // Fetch board with columns and cards
      const { data: boardData, error: boardError } = await supabase
        .from('boards')
        .select('*')
        .eq('id', boardId)
        .single();

      if (boardError) throw boardError;

      // Fetch columns for this board
      const { data: columnsData, error: columnsError } = await supabase
        .from('columns')
        .select('*')
        .eq('board_id', boardId)
        .order('position', { ascending: true });

      if (columnsError) throw columnsError;

      // Fetch all cards for this board's columns
      const columnIds = columnsData.map(col => col.id);
      const { data: cardsData, error: cardsError } = await supabase
        .from('cards')
        .select('*')
        .in('column_id', columnIds)
        .order('position', { ascending: true });

      if (cardsError) throw cardsError;

      // Fetch all tags for this board
      const { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .select('*')
        .eq('board_id', boardId);

      if (tagsError) throw tagsError;

      // Fetch all card-tag relationships
      const { data: cardTagsData, error: cardTagsError } = await supabase
        .from('card_tags')
        .select('*')
        .in('card_id', cardsData.map(card => card.id));

      if (cardTagsError) throw cardTagsError;

      // Build the nested structure
      const columnsWithCards = columnsData.map(column => {
        const columnCards = cardsData
          .filter(card => card.column_id === column.id)
          .map(card => {
            const cardTags = cardTagsData
              .filter(ct => ct.card_id === card.id)
              .map(ct => tagsData.find(tag => tag.id === ct.tag_id))
              .filter(Boolean) as Tag[];

            return {
              ...card,
              tags: cardTags,
            };
          });

        return {
          ...column,
          cards: columnCards,
        };
      });

      setCurrentBoard({
        ...boardData,
        columns: columnsWithCards,
      });
    } catch (error) {
      console.error('Error fetching board details:', error);
      toast({
        title: 'Error fetching board details',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const createBoard = async (title: string, description?: string): Promise<string | null> => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { data, error } = await supabase
        .from('boards')
        .insert({
          title,
          description: description || null,
          user_id: userData.user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setBoards(prev => [data, ...prev]);
      toast({
        title: 'Board created',
        description: 'Your new board has been created successfully.',
      });
      return data.id;
    } catch (error) {
      console.error('Error creating board:', error);
      toast({
        title: 'Error creating board',
        description: 'Please try again later.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateBoard = async (id: string, updates: Partial<Board>) => {
    try {
      const { error } = await supabase
        .from('boards')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setBoards(prev => prev.map(board => (board.id === id ? { ...board, ...updates } : board)));
      
      if (currentBoard && currentBoard.id === id) {
        setCurrentBoard(prev => prev ? { ...prev, ...updates } : null);
      }
      
      toast({
        title: 'Board updated',
        description: 'Your board has been updated successfully.',
      });
    } catch (error) {
      console.error('Error updating board:', error);
      toast({
        title: 'Error updating board',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const deleteBoard = async (id: string) => {
    try {
      const { error } = await supabase
        .from('boards')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBoards(prev => prev.filter(board => board.id !== id));
      
      if (currentBoard && currentBoard.id === id) {
        setCurrentBoard(null);
      }
      
      toast({
        title: 'Board deleted',
        description: 'Your board has been deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting board:', error);
      toast({
        title: 'Error deleting board',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const createColumn = async (title: string, boardId: string) => {
    try {
      // Get the highest position value
      let position = 0;
      if (currentBoard) {
        const positions = currentBoard.columns.map(col => col.position);
        position = positions.length > 0 ? Math.max(...positions) + 1 : 0;
      }

      const { data, error } = await supabase
        .from('columns')
        .insert({
          title,
          board_id: boardId,
          position,
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      if (currentBoard && currentBoard.id === boardId) {
        setCurrentBoard(prev => {
          if (!prev) return null;
          return {
            ...prev,
            columns: [...prev.columns, { ...data, cards: [] }],
          };
        });
      }

      toast({
        title: 'Column created',
        description: 'Your new column has been created successfully.',
      });
    } catch (error) {
      console.error('Error creating column:', error);
      toast({
        title: 'Error creating column',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const updateColumn = async (id: string, updates: Partial<Column>) => {
    try {
      const { error } = await supabase
        .from('columns')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      // Update local state
      if (currentBoard) {
        setCurrentBoard(prev => {
          if (!prev) return null;
          return {
            ...prev,
            columns: prev.columns.map(col => 
              col.id === id ? { ...col, ...updates } : col
            ),
          };
        });
      }

      toast({
        title: 'Column updated',
        description: 'Your column has been updated successfully.',
      });
    } catch (error) {
      console.error('Error updating column:', error);
      toast({
        title: 'Error updating column',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const deleteColumn = async (id: string) => {
    try {
      const { error } = await supabase
        .from('columns')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      if (currentBoard) {
        setCurrentBoard(prev => {
          if (!prev) return null;
          return {
            ...prev,
            columns: prev.columns.filter(col => col.id !== id),
          };
        });
      }

      toast({
        title: 'Column deleted',
        description: 'Your column has been deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting column:', error);
      toast({
        title: 'Error deleting column',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const createCard = async (title: string, columnId: string) => {
    try {
      // Find the column and get the highest position value
      let position = 0;
      if (currentBoard) {
        const column = currentBoard.columns.find(col => col.id === columnId);
        if (column) {
          const positions = column.cards.map(card => card.position);
          position = positions.length > 0 ? Math.max(...positions) + 1 : 0;
        }
      }

      const { data, error } = await supabase
        .from('cards')
        .insert({
          title,
          column_id: columnId,
          position,
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      if (currentBoard) {
        setCurrentBoard(prev => {
          if (!prev) return null;
          return {
            ...prev,
            columns: prev.columns.map(col => {
              if (col.id === columnId) {
                return {
                  ...col,
                  cards: [...col.cards, { ...data, tags: [] }],
                };
              }
              return col;
            }),
          };
        });
      }

      toast({
        title: 'Card created',
        description: 'Your new card has been created successfully.',
      });
    } catch (error) {
      console.error('Error creating card:', error);
      toast({
        title: 'Error creating card',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const updateCard = async (id: string, updates: Partial<Card>) => {
    try {
      const { error } = await supabase
        .from('cards')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      // Update local state
      if (currentBoard) {
        setCurrentBoard(prev => {
          if (!prev) return null;
          return {
            ...prev,
            columns: prev.columns.map(col => {
              const updatedCard = col.cards.find(card => card.id === id);
              if (updatedCard) {
                return {
                  ...col,
                  cards: col.cards.map(card => 
                    card.id === id ? { ...card, ...updates } : card
                  ),
                };
              }
              return col;
            }),
          };
        });
      }

      toast({
        title: 'Card updated',
        description: 'Your card has been updated successfully.',
      });
    } catch (error) {
      console.error('Error updating card:', error);
      toast({
        title: 'Error updating card',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const deleteCard = async (id: string) => {
    try {
      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      if (currentBoard) {
        setCurrentBoard(prev => {
          if (!prev) return null;
          return {
            ...prev,
            columns: prev.columns.map(col => ({
              ...col,
              cards: col.cards.filter(card => card.id !== id),
            })),
          };
        });
      }

      toast({
        title: 'Card deleted',
        description: 'Your card has been deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting card:', error);
      toast({
        title: 'Error deleting card',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const createTag = async (name: string, color: string, boardId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .insert({
          name,
          color,
          board_id: boardId,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Tag created',
        description: 'Your new tag has been created successfully.',
      });
      
      return data.id;
    } catch (error) {
      console.error('Error creating tag:', error);
      toast({
        title: 'Error creating tag',
        description: 'Please try again later.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateTag = async (id: string, updates: Partial<Tag>) => {
    try {
      const { error } = await supabase
        .from('tags')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      // Update local state
      if (currentBoard) {
        setCurrentBoard(prev => {
          if (!prev) return null;
          
          return {
            ...prev,
            columns: prev.columns.map(col => ({
              ...col,
              cards: col.cards.map(card => ({
                ...card,
                tags: card.tags.map(tag => 
                  tag.id === id ? { ...tag, ...updates } : tag
                ),
              })),
            })),
          };
        });
      }

      toast({
        title: 'Tag updated',
        description: 'Your tag has been updated successfully.',
      });
    } catch (error) {
      console.error('Error updating tag:', error);
      toast({
        title: 'Error updating tag',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const deleteTag = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      if (currentBoard) {
        setCurrentBoard(prev => {
          if (!prev) return null;
          
          return {
            ...prev,
            columns: prev.columns.map(col => ({
              ...col,
              cards: col.cards.map(card => ({
                ...card,
                tags: card.tags.filter(tag => tag.id !== id),
              })),
            })),
          };
        });
      }

      toast({
        title: 'Tag deleted',
        description: 'Your tag has been deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast({
        title: 'Error deleting tag',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const addTagToCard = async (cardId: string, tagId: string) => {
    try {
      const { error } = await supabase
        .from('card_tags')
        .insert({
          card_id: cardId,
          tag_id: tagId,
        });

      if (error) {
        // If it's a duplicate, we can ignore
        if (error.code === '23505') return;
        throw error;
      }

      // Update local state
      if (currentBoard) {
        // Find the tag
        let foundTag: Tag | null = null;
        
        for (const column of currentBoard.columns) {
          for (const card of column.cards) {
            const tag = card.tags.find(t => t.id === tagId);
            if (tag) {
              foundTag = tag;
              break;
            }
          }
          if (foundTag) break;
        }

        if (foundTag) {
          setCurrentBoard(prev => {
            if (!prev) return null;
            
            return {
              ...prev,
              columns: prev.columns.map(col => ({
                ...col,
                cards: col.cards.map(card => {
                  if (card.id === cardId) {
                    // Check if tag already exists
                    const tagExists = card.tags.some(t => t.id === tagId);
                    if (!tagExists && foundTag) {
                      return {
                        ...card,
                        tags: [...card.tags, foundTag],
                      };
                    }
                  }
                  return card;
                }),
              })),
            };
          });
        }
      }
    } catch (error) {
      console.error('Error adding tag to card:', error);
      toast({
        title: 'Error adding tag',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const removeTagFromCard = async (cardId: string, tagId: string) => {
    try {
      const { error } = await supabase
        .from('card_tags')
        .delete()
        .match({ card_id: cardId, tag_id: tagId });

      if (error) throw error;

      // Update local state
      if (currentBoard) {
        setCurrentBoard(prev => {
          if (!prev) return null;
          
          return {
            ...prev,
            columns: prev.columns.map(col => ({
              ...col,
              cards: col.cards.map(card => {
                if (card.id === cardId) {
                  return {
                    ...card,
                    tags: card.tags.filter(tag => tag.id !== tagId),
                  };
                }
                return card;
              }),
            })),
          };
        });
      }
    } catch (error) {
      console.error('Error removing tag from card:', error);
      toast({
        title: 'Error removing tag',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const activeId = active.id;
    const overId = over.id;
    
    if (activeId === overId) return;
    
    const activeType = active.data.current.type;
    const overType = over.data.current.type;
    
    // Handle column reordering
    if (activeType === 'column' && overType === 'column') {
      if (!currentBoard) return;
      
      const activeColumnIndex = active.data.current.index;
      const overColumnIndex = over.data.current.index;
      
      // Create a new array of columns
      const newColumns = [...currentBoard.columns];
      const movedColumn = newColumns.splice(activeColumnIndex, 1)[0];
      newColumns.splice(overColumnIndex, 0, movedColumn);
      
      // Update positions
      const updatedColumns = newColumns.map((column, index) => ({
        ...column,
        position: index,
      }));
      
      // Update local state optimistically
      setCurrentBoard(prev => {
        if (!prev) return null;
        return {
          ...prev,
          columns: updatedColumns,
        };
      });
      
      // Update in database
      try {
        for (const column of updatedColumns) {
          if (column.position !== column.position) {
            await supabase
              .from('columns')
              .update({ position: column.position })
              .eq('id', column.id);
          }
        }
      } catch (error) {
        console.error('Error updating column positions:', error);
        // Revert to original state on error
        fetchBoardDetails(currentBoard.id);
        toast({
          title: 'Error updating columns',
          description: 'Please try again later.',
          variant: 'destructive',
        });
      }
    }
    
    // Handle card reordering within the same column
    if (activeType === 'card' && overType === 'card' && active.data.current.columnId === over.data.current.columnId) {
      if (!currentBoard) return;
      
      const columnId = active.data.current.columnId;
      if (!columnId) return;
      
      const column = currentBoard.columns.find(col => col.id === columnId);
      if (!column) return;
      
      const activeCardIndex = active.data.current.index;
      const overCardIndex = over.data.current.index;
      
      // Create a new array of cards
      const newCards = [...column.cards];
      const movedCard = newCards.splice(activeCardIndex, 1)[0];
      newCards.splice(overCardIndex, 0, movedCard);
      
      // Update positions
      const updatedCards = newCards.map((card, index) => ({
        ...card,
        position: index,
      }));
      
      // Update local state optimistically
      setCurrentBoard(prev => {
        if (!prev) return null;
        return {
          ...prev,
          columns: prev.columns.map(col => {
            if (col.id === columnId) {
              return {
                ...col,
                cards: updatedCards,
              };
            }
            return col;
          }),
        };
      });
      
      // Update in database
      try {
        for (const card of updatedCards) {
          if (card.position !== card.position) {
            await supabase
              .from('cards')
              .update({ position: card.position })
              .eq('id', card.id);
          }
        }
      } catch (error) {
        console.error('Error updating card positions:', error);
        // Revert to original state on error
        fetchBoardDetails(currentBoard.id);
        toast({
          title: 'Error updating cards',
          description: 'Please try again later.',
          variant: 'destructive',
        });
      }
    }
    
    // Handle card moving between columns
    if (activeType === 'card' && overType === 'card' && active.data.current.columnId !== over.data.current.columnId) {
      if (!currentBoard) return;
      
      const sourceColumnId = active.data.current.columnId;
      const destinationColumnId = over.data.current.columnId;
      
      if (!sourceColumnId || !destinationColumnId) return;
      
      const sourceColumn = currentBoard.columns.find(col => col.id === sourceColumnId);
      const destinationColumn = currentBoard.columns.find(col => col.id === destinationColumnId);
      
      if (!sourceColumn || !destinationColumn) return;
      
      const activeCardIndex = active.data.current.index;
      const overCardIndex = over.data.current.index;
      
      // Get the card being moved
      const cardToMove = sourceColumn.cards[activeCardIndex];
      
      // Remove from source column
      const newSourceCards = [...sourceColumn.cards];
      newSourceCards.splice(activeCardIndex, 1);
      
      // Add to destination column
      const newDestinationCards = [...destinationColumn.cards];
      newDestinationCards.splice(overCardIndex, 0, {
        ...cardToMove,
        column_id: destinationColumnId,
      });
      
      // Update positions for both columns
      const updatedSourceCards = newSourceCards.map((card, index) => ({
        ...card,
        position: index,
      }));
      
      const updatedDestinationCards = newDestinationCards.map((card, index) => ({
        ...card,
        position: index,
      }));
      
      // Update local state optimistically
      setCurrentBoard(prev => {
        if (!prev) return null;
        return {
          ...prev,
          columns: prev.columns.map(col => {
            if (col.id === sourceColumnId) {
              return {
                ...col,
                cards: updatedSourceCards,
              };
            }
            if (col.id === destinationColumnId) {
              return {
                ...col,
                cards: updatedDestinationCards,
              };
            }
            return col;
          }),
        };
      });
      
      // Update in database
      try {
        // Update the moved card's column_id and position
        await supabase
          .from('cards')
          .update({
            column_id: destinationColumnId,
            position: overCardIndex,
          })
          .eq('id', cardToMove.id);
        
        // Update positions of cards in source column
        for (const card of updatedSourceCards) {
          if (card.position !== card.position) {
            await supabase
              .from('cards')
              .update({ position: card.position })
              .eq('id', card.id);
          }
        }
        
        // Update positions of cards in destination column
        for (const card of updatedDestinationCards) {
          if (card.id !== cardToMove.id && card.position !== card.position) {
            await supabase
              .from('cards')
              .update({ position: card.position })
              .eq('id', card.id);
          }
        }
      } catch (error) {
        console.error('Error moving card between columns:', error);
        // Revert to original state on error
        fetchBoardDetails(currentBoard.id);
        toast({
          title: 'Error moving card',
          description: 'Please try again later.',
          variant: 'destructive',
        });
      }
    }
  };

  const value = {
    boards,
    currentBoard,
    isLoading,
    fetchBoards,
    fetchBoardDetails,
    createBoard,
    updateBoard,
    deleteBoard,
    createColumn,
    updateColumn,
    deleteColumn,
    createCard,
    updateCard,
    deleteCard,
    createTag,
    updateTag,
    deleteTag,
    addTagToCard,
    removeTagFromCard,
    handleDragEnd,
  };

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
}

export function useBoard() {
  const context = useContext(BoardContext);
  if (context === undefined) {
    throw new Error('useBoard must be used within a BoardProvider');
  }
  return context;
}