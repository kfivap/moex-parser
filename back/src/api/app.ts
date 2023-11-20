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

    const query: PrismaType.derivativeWhereInput | PrismaType.match_derivativeWhereInput = {
        isin, contract_type: contractTypes.futures
    }
    const limit = Number(req.query.limit) || 30

    const [fizDerivatives, legalDerivatives, matchData] = await Promise.all([
        prismaClient.derivative.findMany({
            where: {
                ...query as PrismaType.derivativeWhereInput,
                iz_fiz: true
            },
            take: limit,
            orderBy: { date: 'desc' }
        }),
        prismaClient.derivative.findMany({
            where: {
                ...query as PrismaType.derivativeWhereInput,
                iz_fiz: false
            },
            take: limit,
            orderBy: { date: 'desc' }
        }),
        prismaClient.match_derivative.findMany({
            where: {
                ...query as PrismaType.match_derivativeWhereInput,
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
    const grouped = await prismaClient.derivative.groupBy({
        by: ['isin', 'name'],
        where: {
            contract_type: contractTypes.futures,
        },
        _sum: {
            short_position: true, long_position: true
        },
    })

    const result: ApiIsinListResponse = grouped.sort((a, b) => b._sum.long_position - a._sum.long_position)
    res.json(result)
    return
})

app.use((req, res) => {
    res.sendStatus(404)
})

export const server = app 