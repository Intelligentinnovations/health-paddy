/* eslint-disable @typescript-eslint/no-var-requires */
const { Kysely, PostgresDialect } = require("kysely");
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");


async function executeAllSeedFiles(db: any): Promise<void> {
  const folderPath = __dirname;
  const files = fs.readdirSync(folderPath);

  for await (const file of files) {
    if (file !== "seed.ts") {
      const filePath = path.join(folderPath, file);
      try {
        const module = require(filePath);
        module(db);
      } catch (error) {
        console.error(`Error importing or executing ${filePath}: ${error}`);
      }
    }
  }
}

try {

  const dialect = new PostgresDialect({
    pool: new Pool({
      database: "health_paddy",
      port: 5432,
      password: "password",
      host: "localhost",
      user: "postgres"
    })
  })

  const db = new Kysely({ dialect });
  executeAllSeedFiles(db);

}
catch (error) {
  console.error(error);
  process.exit(1);
}
