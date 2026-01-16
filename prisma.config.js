/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("node:path");
require("dotenv").config();

const databaseUrl = process.env.DATABASE_URL;

module.exports = {
  schema: path.join(__dirname, "prisma", "schema.prisma"),
  datasource: {
    url: databaseUrl,
  },
};
