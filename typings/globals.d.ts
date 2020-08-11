type Struct = NodeJS.Dict<any>;
type Dataset = Array<Struct>;
type Fields = Array<string>;

interface Cursor {
}

interface Database {
  query(sql: string, values): Cursor;
  insert(table: string, record: Struct): Cursor;
  select(table: string, fields: Fields, conditions: Struct): Promise<Dataset>;
  delete(table: string, conditions: Struct): Cursor;
  update(table: string, delta: Struct, conditions: Struct): Cursor;
  close(): void;
}

interface Security {
  hashPassword(password: string): Promise<string>;
  validatePassword(password: string, hash: string): Promise<string>;
}

interface Application {
  security: Security;
  introspect(): Promise<Array<string>>;
  db: Database;
}

declare var application: Application;
declare var api: NodeJS.Dict<any>;
