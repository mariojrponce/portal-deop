import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const DB_PATH = process.env.PORTAL_DB_PATH ?? "data/portal.db";

mkdirSync(dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH, { create: true });
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nome TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    url TEXT NOT NULL,
    descricao TEXT,
    icone TEXT,
    ordem INTEGER NOT NULL DEFAULT 0,
    criado_por INTEGER REFERENCES admins(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

export type AdminRow = {
  id: number;
  email: string;
  password_hash: string;
  nome: string;
  created_at: string;
};

export type LinkRow = {
  id: number;
  titulo: string;
  url: string;
  descricao: string | null;
  icone: string | null;
  ordem: number;
  criado_por: number | null;
  created_at: string;
  updated_at: string;
};
