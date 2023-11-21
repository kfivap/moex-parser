import express from 'express'
import cors from 'cors'
import { contractTypes } from '../constants'
import { prismaClient } from '../db/prisma-client'
import type { Prisma as PrismaType } from '@prisma/client'
import type { ApiIsinListResponse, ApiDerivativesResponse, ApiIsin } from '../../../common/types'
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

 
    const limit = Number(req.query.limit) || 30

    const [fizDerivatives, legalDerivatives, matchData] = await Promise.all([
        prismaClient.derivative_open_positions.findMany({
            where: {
                derivative: {
                    isin,
                },
                contract_type: contractTypes.futures,
                iz_fiz: true
            },
            include: {
                derivative: true
            },
            take: limit,
            orderBy: { date: 'desc' }
        }),
        prismaClient.derivative_open_positions.findMany({
            where: {
                derivative: {
                    isin,
                },
                contract_type: contractTypes.futures,
                iz_fiz: false
            },
            include: {
                derivative: true
            },
            take: limit,
            orderBy: { date: 'desc' }
        }),
        prismaClient.match_derivative_open_positions.findMany({
            where: {
                derivative: {
                    isin,
                },
                contract_type: contractTypes.futures,
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
    const result: ApiIsinListResponse = await prismaClient.derivative_open_positions.findMany({
        orderBy: {
            long_position: 'desc'
        },
        include: {
            derivative: true
        },
        distinct: ['derivative_id']
    })

    res.json(result)
    return
})

app.use((req, res) => {
    res.sendStatus(404)
})

export const server = app 