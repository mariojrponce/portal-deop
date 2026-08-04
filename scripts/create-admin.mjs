// Cria o primeiro (ou mais um) administrador direto no SQLite. Rodar uma vez
// durante o deploy: `bun run create-admin -- --email=... --nome=... --senha=...`.
// Não existe rota web de auto-cadastro de admin de propósito — só este script,
// ou o painel /admin já logado.
import { db } from "../src/lib/db.server.ts";

function argValue(flag) {
  const prefix = `--${flag}=`;
  const found = process.argv.find((a) => a.startsWith(prefix));
  return found ? found.slice(prefix.length) : undefined;
}

async function main() {
  const email = argValue("email")?.trim().toLowerCase();
  const nome = argValue("nome")?.trim();
  const senha = argValue("senha");

  if (!email || !nome || !senha) {
    console.error(
      "Uso: bun run create-admin -- --email=admin@exemplo.com --nome=\"Nome Completo\" --senha=\"senha forte\"",
    );
    process.exit(1);
  }
  if (!email.includes("@")) {
    console.error("E-mail inválido.");
    process.exit(1);
  }
  if (senha.length < 8) {
    console.error("Senha precisa ter no mínimo 8 caracteres.");
    process.exit(1);
  }

  const existing = db.query("SELECT id FROM admins WHERE email = ?").get(email);
  if (existing) {
    console.error(`Já existe um admin com o e-mail ${email}.`);
    process.exit(1);
  }

  const password_hash = await Bun.password.hash(senha);
  db.query("INSERT INTO admins (email, nome, password_hash) VALUES (?, ?, ?)").run(
    email,
    nome,
    password_hash,
  );

  console.log(`Admin "${nome}" (${email}) criado com sucesso.`);
}

main();
