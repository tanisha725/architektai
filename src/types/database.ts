export interface Column {
  name: string;
  type: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  references?: string; // "table.column"
}

export interface Table {
  name: string;
  columns: Column[];
  reason: string; // which requirement justified this table
}

export interface Relationship {
  description: string; // e.g. "Many posts belong to one user"
  from: string; // "posts.user_id"
  to: string; // "users.id"
}

export interface DatabaseSchema {
  tables: Table[];
  relationships: Relationship[];
}
