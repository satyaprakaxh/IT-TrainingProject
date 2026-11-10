const path = require("path");

// Load .env from the server folder explicitly
require("dotenv").config({
    path: path.resolve(__dirname, "../../.env")
});

const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL is missing from server/.env");
}

const adapter = new PrismaPg({
    connectionString: connectionString
});

const prisma = new PrismaClient({
    adapter: adapter
});

module.exports = prisma;