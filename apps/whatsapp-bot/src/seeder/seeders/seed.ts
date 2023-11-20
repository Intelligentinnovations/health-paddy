/* eslint-disable @typescript-eslint/no-var-requires */
const { Kysely, PostgresDialect } = require('kysely');
const { Pool } = require('pg');
const seedFileName = process.argv[2];

if (!seedFileName) {
  console.error('Please provide the seed file name.');
  process.exit(1);
}

try {

  const dialect = new PostgresDialect({
    pool: new Pool({
      database: 'health_paddy',
      port: 5432,
      password: 'postgres',
      host: 'localhost',
      user: 'postgres'
    })
  })

  const db = new Kysely({ dialect });
  const seedFunction = require(`./${seedFileName}`);
  seedFunction(db);
}
catch (error) {
  console.error(`Error loading or executing seed file: ${seedFileName}`);
  console.error(error);
  process.exit(1);
}
