// https://www.moex.com/ru/derivatives/open-positions-csv.aspx?d=20220125&t=1
import https from 'https'
import csv from 'csv-parser'
import moment from "moment";
import { contractTypes } from './constants';
import * as path from 'path'
import { access } from 'fs/promises'
import { createWriteStream, createReadStream, ReadStream } from 'fs'
import { prismaClient } from './db/prisma-client';
import { derivative } from '@prisma/client'
import type { Prisma as PrismaType } from '@prisma/client'


const CSV_DOCUMENT_DATE_FORMAT = 'YYYYMMDD'

const parseFloatOrReturnZero = (strNum): number => parseFloat(strNum) || 0

type DateWithFormatted = {
    formatted: string,
    date: moment.Moment
}

function derivativesMapper(rawDerivative): PrismaType.derivativeCreateInput {
    return {
        date: moment(rawDerivative['date']).utc(true).toDate(),
        isin: rawDerivative.isin,
        name: rawDerivative.name,
        contract_type: rawDerivative.contract_type,
        iz_fiz: !!rawDerivative.iz_fiz,
        clients_in_long: parseFloatOrReturnZero(rawDerivative.clients_in_long),
        clients_in_short: parseFloatOrReturnZero(rawDerivative.clients_in_short),
        short_position: parseFloatOrReturnZero(rawDerivative.short_position),
        long_position: parseFloatOrReturnZero(rawDerivative.long_position),
        change_prev_week_short_abs: parseFloatOrReturnZero(rawDerivative.change_prev_week_short_abs),
        change_prev_week_long_abs: parseFloatOrReturnZero(rawDerivative.change_prev_week_long_abs),
        change_prev_week_short_perc: parseFloatOrReturnZero(rawDerivative.change_prev_week_short_perc),
        change_prev_week_long_perc: parseFloatOrReturnZero(rawDerivative.change_prev_week_long_perc),
    }
}
process.on('uncaughtException', (e) => {
    console.log(e.message, e.name, e.stack)
})


function safeParsePercent(a: number, b: number): number {
    const result = ((a || 0) / (b || 0))
    if (!result) {
        return 0
    }
    if (result == Number.POSITIVE_INFINITY) {
        return 999999999
    } else if (result == Number.NEGATIVE_INFINITY) {
        return -999999999
    }
    return result
}

function matchDerivativesByDate(date: Date, isin: string, fiz: derivative, legal: derivative): PrismaType.match_derivativeCreateManyInput {
    const contractType = contractTypes.futures

    const data: PrismaType.match_derivativeCreateManyInput = {
        date: date,
        isin: isin,
        contract_type: contractType,
        fiz_derivative_id: fiz.id,
        legal_derivative_id: fiz.id,
        legal_long_to_fiz_long: safeParsePercent(legal?.long_position , fiz?.long_position),
        legal_short_to_fiz_short: safeParsePercent(legal?.short_position, fiz?.short_position),
        legal_long_to_fiz_short: safeParsePercent(legal?.long_position, fiz?.short_position),
        legal_short_to_fiz_long: safeParsePercent(legal?.short_position, fiz?.long_position ),
    }

    return data
}


export async function createDbData(): Promise<void> {
    // debug
    // await prismaClient.match_derivative.deleteMany({ where: {} })
    // await prismaClient.derivative.deleteMany({ where: {} })
    // debug


    try {
        const daysArr = await dataArrayGenerator(365)
        for (const day of daysArr) {
            const data = await getDataByDay(day.formatted)

            if (!data.length) continue
            const formatted: PrismaType.derivativeCreateInput[] = data.map(derivativesMapper)

            const couples: {
                [isin: string]: {
                    [contractType: string]: {
                        fiz?: derivative,
                        legal?: derivative
                    }
                }
            } = {}
            // const createManyDerivatives: PrismaType.derivativeCreateManyInput = []
            console.log('fetchData: upsert derivatives start')

            for (const row of formatted) {
                // create couples
                if (!couples[row.isin]) {
                    couples[row.isin] = {}
                }
                if (!couples[row.isin][row.contract_type]) {
                    couples[row.isin][row.contract_type] = {}
                }
                const fizOrLegal = row.iz_fiz ? 'fiz' : 'legal'

                const result = await prismaClient.derivative.upsert({
                    where: {
                        derivatives_unique: {
                            date: row.date,
                            isin: row.isin,
                            iz_fiz: row.iz_fiz,
                            contract_type: row.contract_type
                        }
                    },
                    create: row,
                    update: row
                })
                couples[row.isin][row.contract_type][fizOrLegal] = result
            }
            console.log('fetchData: upsert derivatives done')

            const matchDerivativesCreateMany: PrismaType.match_derivativeCreateManyInput[] = []
            for (const isin in couples) {
                const result = matchDerivativesByDate(
                    day.date.toDate(),
                    isin,
                    couples[isin]?.[contractTypes.futures].fiz,
                    couples[isin]?.[contractTypes.futures].legal
                )
                matchDerivativesCreateMany.push(result)
                
            }
            await prismaClient.match_derivative.createMany({
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
        const docsExist = await prismaClient.derivative.findFirst({ where: { date: date } })
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
