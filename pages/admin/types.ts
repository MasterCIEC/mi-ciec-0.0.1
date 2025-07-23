export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'email';
  required?: boolean;
}

export interface CrudConfig {
  tableName: string;
  pageTitle: string;
  itemName: string;
  columns: { key: string; header: string }[];
  formFields: FormField[];
  selects?: Record<string, { tableName: string; key: string; value: string; }>;
  join?: string;
  unique_column?: string;
  unique_composite_columns?: string[];
}

export interface SelectData {
  id: string | number;
  name: string;
}