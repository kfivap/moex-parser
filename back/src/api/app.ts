import express from 'express'
import cors from 'cors'
import { contractTypes } from '../constants'
import { prismaClient } from '../db/prisma-client'
import type { Prisma as PrismaType } from '@prisma/client'
import type { ApiIsinListResponse, ApiDerivativesResponse } from '../../../common/types'
const app = express()

app.use(cors())
app.use(express.json())

app.use((req, res, next) => {
    console.log(req.originalUrl)
    next()
})

app.get('/derivatives', async (req, res) => {
    const isin = req.query.isin as string
    if (!isin) return res.sendStatus(400)

    const query: PrismaType.derivative_open_positionsWhereInput | PrismaType.match_derivative_open_positionsWhereInput = {
        isin, contract_type: contractTypes.futures
    }
    const limit = Number(req.query.limit) || 30

    const [fizDerivatives, legalDerivatives, matchData] = await Promise.all([
        prismaClient.derivative_open_positions.findMany({
            where: {
                ...query as PrismaType.derivative_open_positionsWhereInput,
                iz_fiz: true
            },
            take: limit,
            orderBy: { date: 'desc' }
        }),
        prismaClient.derivative_open_positions.findMany({
            where: {
                ...query as PrismaType.derivative_open_positionsWhereInput,
                iz_fiz: false
            },
            take: limit,
            orderBy: { date: 'desc' }
        }),
        prismaClient.match_derivative_open_positions.findMany({
            where: {
                ...query as PrismaType.match_derivative_open_positionsWhereInput,
            },
            take: limit,
            orderBy: { date: 'desc' }
        })
    ])

    const result: ApiDerivativesResponse = { fizDerivatives, legalDerivatives, matchData }

    res.json(result)
    return
})


app.get('/isin', async (req, res) => {
    const grouped = await prismaClient.derivative_open_positions.groupBy({
        by: ['derivative_id'],
        where: {
            contract_type: contractTypes.futures,
        },
        _sum: {
            short_position: true, long_position: true
        },
        
    })

    const result: any = grouped.sort((a, b) => b._sum.long_position - a._sum.long_position)
    res.json(result)
    return
})

app.use((req, res) => {
    res.sendStatus(404)
})

export const server = app 