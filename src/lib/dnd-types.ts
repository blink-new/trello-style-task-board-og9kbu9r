
export type DragEndEvent = {
  active: {
    id: string;
    data: {
      current: {
        type: 'column' | 'card';
        columnId?: string;
        index: number;
      };
    };
  };
  over: {
    id: string;
    data: {
      current: {
        type: 'column' | 'card';
        columnId?: string;
        index: number;
      };
    };
  } | null;
};