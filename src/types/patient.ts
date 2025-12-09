// Patient data type definition
export interface Patient {
  [key: string]: string | number | null;
}

// Table filter state
export interface FilterState {
  column: string;
  value: string;
}

// Sort state  
export interface SortState {
  column: string;
  direction: 'asc' | 'desc' | null;
}

// Column definition
export interface ColumnDef {
  field: string;
  headerName: string;
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
}
