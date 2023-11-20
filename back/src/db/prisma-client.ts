import { PrismaClient } from '@prisma/client'
require('dotenv/config')

const _prisma = new PrismaClient(
    // { log: ['query', 'info', 'warn', 'error']}
)
export const prismaClient = _prisma