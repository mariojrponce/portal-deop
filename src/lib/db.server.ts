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
    login TEXT UNIQUE NOT NULL,
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

// Migração leve: bancos criados antes da troca de login por e-mail para
// login por usuário simples tinham a coluna "email" em vez de "login".
{
  const cols = db.query("PRAGMA table_info(admins)").all() as { name: string }[];
  const hasEmail = cols.some((c) => c.name === "email");
  const hasLogin = cols.some((c) => c.name === "login");
  if (hasEmail && !hasLogin) {
    db.exec("ALTER TABLE admins RENAME COLUMN email TO login;");
  }
}

export type AdminRow = {
  id: number;
  login: string;
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
