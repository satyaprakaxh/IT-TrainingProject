// Prisma 7 configuration file
// Reference: https://www.prisma.io/docs/orm/reference/prisma-config-reference

require('dotenv').config();

module.exports = {
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL
  }
};

