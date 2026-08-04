// Cria o primeiro (ou mais um) administrador direto no SQLite. Rodar uma vez
// durante o deploy: `bun run create-admin -- --login=... --nome=... --senha=...`.
// Não existe rota web de auto-cadastro de admin de propósito — só este script,
// ou o painel /admin já logado.
import { db } from "../src/lib/db.server.ts";

function argValue(flag) {
  const prefix = `--${flag}=`;
  const found = process.argv.find((a) => a.startsWith(prefix));
  return found ? found.slice(prefix.length) : undefined;
}

async function main() {
  const login = argValue("login")?.trim().toLowerCase();
  const nome = argValue("nome")?.trim();
  const senha = argValue("senha");

  if (!login || !nome || !senha) {
    console.error(
      'Uso: bun run create-admin -- --login=mario.admin --nome="Nome Completo" --senha="senha forte"',
    );
    process.exit(1);
  }
  if (!/^[a-z0-9._-]+$/.test(login)) {
    console.error("Login inválido: use apenas letras, números, ponto, hífen ou underline.");
    process.exit(1);
  }
  if (senha.length < 8) {
    console.error("Senha precisa ter no mínimo 8 caracteres.");
    process.exit(1);
  }

  const existing = db.query("SELECT id FROM admins WHERE login = ?").get(login);
  if (existing) {
    console.error(`Já existe um admin com o login ${login}.`);
    process.exit(1);
  }

  const password_hash = await Bun.password.hash(senha);
  db.query("INSERT INTO admins (login, nome, password_hash) VALUES (?, ?, ?)").run(
    login,
    nome,
    password_hash,
  );

  console.log(`Admin "${nome}" (${login}) criado com sucesso.`);
}

main();
