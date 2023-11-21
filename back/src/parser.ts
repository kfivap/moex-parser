// https://www.moex.com/ru/forts/contractbaseresults-exp.aspx?day1=20221014&day2=20231121&base=BR
// https://www.moex.com/ru/derivatives/open-positions-csv.aspx?d=20220125&t=1
import https from 'https'
import csv from 'csv-parser'
import moment from "moment";
import { contractTypes } from './constants';
import * as path from 'path'
import { access } from 'fs/promises'
import { createWriteStream, createReadStream, ReadStream } from 'fs'
import { prismaClient } from './db/prisma-client';
import { derivative, derivative_open_positions } from '@prisma/client'
import type { Prisma as PrismaType } from '@prisma/client'
import { CSV_DOCUMENT_DATE_FORMAT, parseFloatOrReturnZero, safeParsePercent } from './utils/utils';

type DateWithFormatted = {
    formatted: string,
    date: moment.Moment
}

function derivativesMapper(rawDerivative: Record<string, any>, derivativeId: number): PrismaType.derivative_open_positionsCreateManyInput {
    return {
        date: moment(rawDerivative['date']).utc(true).toDate(),
        derivative_id: derivativeId,
        contract_type: rawDerivative.contract_type,
        iz_fiz: !!rawDerivative.iz_fiz,
        clients_in_long: parseFloatOrReturnZero(rawDerivative.clients_in_long),
        clients_in_short: parseFloatOrReturnZero(rawDerivative.clients_in_short),
        short_position: parseFloatOrReturnZero(rawDerivative.short_position),
        long_position: parseFloatOrReturnZero(rawDerivative.long_position),
    }
}
process.on('uncaughtException', (e) => {
    console.log(e.message, e.name, e.stack)
})

function matchDerivativesByDate(date: Date, isin: string, fiz: derivative_open_positions, legal: derivative_open_positions): PrismaType.match_derivative_open_positionsCreateManyInput {
    const contractType = contractTypes.futures

    const data: PrismaType.match_derivative_open_positionsCreateManyInput = {
        date: date,
        isin: isin,
        contract_type: contractType,
        fiz_open_positions_id: fiz.id,
        legal_open_positions_id: fiz.id,
        legal_long_to_fiz_long: safeParsePercent(legal?.long_position, fiz?.long_position),
        legal_short_to_fiz_short: safeParsePercent(legal?.short_position, fiz?.short_position),
        legal_long_to_fiz_short: safeParsePercent(legal?.long_position, fiz?.short_position),
        legal_short_to_fiz_long: safeParsePercent(legal?.short_position, fiz?.long_position),
    }

    return data
}


export async function createDbData(): Promise<void> {
    // debug
    // await prismaClient.match_derivative_open_positions.deleteMany({ where: {} })
    // await prismaClient.derivative_open_positions.deleteMany({ where: {} })
    // await prismaClient.derivative.deleteMany({ where: {} })
    // debug


    try {
        const daysArr = await dataArrayGenerator(365)
        const isinToDerivativeId: { [isin: string]: number } = {}
        const couples: {
            [derivativeId: number]: {
                [contractType: string]: {
                    fiz?: derivative_open_positions,
                    legal?: derivative_open_positions
                }
            }
        } = {}

        for (const day of daysArr) {
            const rawData = await getDataByDay(day.formatted)

            if (!rawData.length) continue


            const formattedData: PrismaType.derivative_open_positionsCreateManyInput[] = []

            for (const row of rawData) {

                if (!isinToDerivativeId[row.isin]) {
                    const derivativeExist = await prismaClient.derivative.findFirst({ where: { isin: row.isin } })
                    if (derivativeExist) {
                        isinToDerivativeId[row.isin] = derivativeExist.id
                    } else {
                        const derivative = await prismaClient.derivative.create({
                            data: {
                                name: row.name,
                                isin: row.isin
                            }
                        })
                        isinToDerivativeId[row.isin] = derivative.id
                    }
                }
                const derivativeId = isinToDerivativeId[row.isin]

                formattedData.push(derivativesMapper(row, derivativeId))
            }

            console.log('fetchData: upsert derivatives start')

            for (const row of formattedData) {
                // create couples
                if (!couples[row.derivative_id]) {
                    couples[row.derivative_id] = {}
                }
                if (!couples[row.derivative_id][row.contract_type]) {
                    couples[row.derivative_id][row.contract_type] = {}
                }
                const fizOrLegal = row.iz_fiz ? 'fiz' : 'legal'

                const result = await prismaClient.derivative_open_positions.upsert({
                    where: {
                        derivatives_unique: {
                            date: row.date,
                            derivative_id: row.derivative_id,
                            iz_fiz: row.iz_fiz,
                            contract_type: row.contract_type
                        }
                    },
                    create: row,
                    update: row
                })
                couples[row.derivative_id][row.contract_type][fizOrLegal] = result
            }
            console.log('fetchData: upsert derivatives done')

            const matchDerivativesCreateMany: PrismaType.match_derivative_open_positionsCreateManyInput[] = []
            for (const derivativeId in couples) {
                const result = matchDerivativesByDate(
                    day.date.toDate(),
                    derivativeId,
                    couples[derivativeId]?.[contractTypes.futures].fiz,
                    couples[derivativeId]?.[contractTypes.futures].legal
                )
                matchDerivativesCreateMany.push(result)

            }
            await prismaClient.match_derivative_open_positions.createMany({
                data: matchDerivativesCreateMany
            })
            console.log('fetchData: match derivatives done')
        }
    } catch (e) {
        console.log(999, e)
    }

}

async function dataArrayGenerator(range): Promise<DateWithFormatted[]> {
    const daysArr: DateWithFormatted[] = []
    for (let i = 0; i < range; i++) {
        const date = moment().subtract(i, 'd')
            .set("hour", 0)
            .set("minute", 0)
            .set("second", 0)
            .set("millisecond", 0)
            .utc(true)
            .toISOString()
        const docsExist = await prismaClient.derivative_open_positions.findFirst({ where: { date: date } })
        if (docsExist) break
        daysArr.push({
            date: moment(date).utc(false),
            formatted: moment(date).utc(true).format(CSV_DOCUMENT_DATE_FORMAT)
        })
    }
    return daysArr
}

async function getLocalOrFetchFile(day: string): Promise<ReadStream> {
    const filePath = path.join(__dirname, '../derivatives_files', `${day}.csv`)
    const fileExists = await access(filePath).then(() => true).catch(() => false)
    console.log('fileExists', day, fileExists)
    if (fileExists) {
        return createReadStream(filePath)
    }

    const fetchDataPromise = new Promise((resolve, reject) => {
        const results: any[] = [];
        const url = `https://www.moex.com/ru/derivatives/open-positions-csv.aspx?d=${day}&t=1`
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
        }
        const originalResponseStream = createWriteStream(filePath);
        console.log(url)
        try {
            https.get(url, { headers }, function (res) {
                try {
                    res.pipe(originalResponseStream)
                        .on('close', () => {
                            originalResponseStream.close()
                            resolve(results)
                        })
                        .on('error', (e) => {
                            reject(e)
                        })
                } catch (e) {
                    console.log(111, e)
                    reject(e)
                }
            });
        } catch (e) {
            console.log(2222, e)
            reject(e)
        }
    })
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
            reject()
        }, 10000)
    })
    await Promise.race([fetchDataPromise, timeoutPromise])

    return getLocalOrFetchFile(day)
}

async function getDataByDay(day: string) {
    try {
        const dataRaw = await getLocalOrFetchFile(day)

        const results: any[] = [];

        return new Promise((resolve, reject) => {
            dataRaw
                .pipe(csv({
                    mapHeaders: ({ header, index }) => {
                        if (index === 0) {
                            return 'date' //moment in wrong encoding or idk
                        }
                        return header.toLowerCase()
                    }
                }))
                .on('data', (data) => {
                    results.push(data)
                })
                .on('error', (e) => {
                    dataRaw.close()
                    reject(e)
                })
                .on('end', () => {
                    dataRaw.close()
                    resolve(results)
                })
        })
    } catch (e) {
        console.log(3333, e)
        return getDataByDay(day)
    }
}
