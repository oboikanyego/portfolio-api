const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline/promises');
const bcrypt = require('bcryptjs');

const envPath = path.join(__dirname, '..', '.env');

function setEnvValue(source, key, value) {
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, 'm');
  return pattern.test(source) ? source.replace(pattern, line) : `${source.trimEnd()}\n${line}\n`;
}

async function main() {
  const cli = readline.createInterface({ input: process.stdin, output: process.stdout });
  const email = (process.env.ADMIN_SETUP_EMAIL || await cli.question('Admin email: ')).trim().toLowerCase();
  const password = process.env.ADMIN_SETUP_PASSWORD || await cli.question('Admin password (12+ characters): ');
  cli.close();

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new Error('Enter a valid admin email address.');
  }
  if (password.length < 12) {
    throw new Error('The admin password must contain at least 12 characters.');
  }

  let env = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  env = setEnvValue(env, 'ADMIN_EMAIL', email);
  env = setEnvValue(env, 'ADMIN_PASSWORD_HASH', await bcrypt.hash(password, 12));
  env = setEnvValue(env, 'AUTH_TOKEN_SECRET', crypto.randomBytes(48).toString('hex'));
  fs.writeFileSync(envPath, env, 'utf8');
  console.log('Admin credentials saved. Restart the API to apply them.');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
