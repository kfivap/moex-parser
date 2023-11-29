// https://www.moex.com/ru/forts/contractbaseresults-exp.aspx?day1=20221014&day2=20231121&base=BR
import csv from 'csv-parser'
import moment from "moment";
import * as path from 'path'
import { access } from 'fs/promises'
import { createReadStream, ReadStream } from 'fs'
import { prismaClient } from './db/prisma-client';
import type { Prisma as PrismaType } from '@prisma/client'
import { CSV_DOCUMENT_DATE_FORMAT, parseFloatOrReturnZero, userAgentHeaders } from './utils/utils';
import https from 'https'

import iconv from 'iconv-lite'
import * as fs from 'fs'

const derivativeDayRangeToFileName = ({ startDay, endDay, code }: DerivativeDayRangeType): string => {
    return `${startDay}_${endDay}_${code}.csv`
}

type DerivativeDayRangeType = {
    startDay: string, endDay: string, code: string
}
type DateWithFormatted = {
    formatted: string,
    date: moment.Moment
}

function derivativesPriceMapper(rawDerivative: Record<string, any>, derivativeId: number): PrismaType.derivative_pricesCreateManyInput {
    return {
        date: moment(rawDerivative['date'], 'DD.MM.YYYY').utc(true).toDate(),
        derivative_id: derivativeId,

        futures_code: rawDerivative['кодфьючерса'],

        weighted_average_price_per_lot: parseFloatOrReturnZero(rawDerivative['средне-взвешеннаяцена за лот']),
        calculated_price: parseFloatOrReturnZero(rawDerivative['расчетнаяцена']),
        first_deal_price: parseFloatOrReturnZero(rawDerivative['ценапервойсделки']),
        max_price: parseFloatOrReturnZero(rawDerivative['максим.цена']),
        min_price: parseFloatOrReturnZero(rawDerivative['миним.цена']),
        last_deal_price: parseFloatOrReturnZero(rawDerivative['ценапоследнейсделки']),
        change: parseFloatOrReturnZero(rawDerivative['изменение']),

        last_deal_volume_contracts: parseFloatOrReturnZero(rawDerivative['объемпоследнейсделки,контр.']),
        number_of_deals: parseFloatOrReturnZero(rawDerivative['числосделок']),
        trading_volume_rub: parseFloatOrReturnZero(rawDerivative['объемторгов,руб.']),
        trading_volume_contracts: parseFloatOrReturnZero(rawDerivative['объемторгов,контр.']),
        open_position_volume_rub: parseFloatOrReturnZero(rawDerivative['объемоткрытыхпозиций,руб.']),
        open_position_volume_contracts: parseFloatOrReturnZero(rawDerivative['объемоткрытыхпозиций,контр.']),

        margin_per_contract_rub: parseFloatOrReturnZero(rawDerivative['размерыго(руб./контракт)']),
    }
}


async function getLocalOrFetchFile(derivativeDayRange: DerivativeDayRangeType): Promise<ReadStream> {
    const fileName = derivativeDayRangeToFileName(derivativeDayRange)
    const filePath = path.join(__dirname, '../files/trade_results', fileName)
    const fileExists = await access(filePath).then(() => true).catch(() => false)
    console.log('fileExists', fileName, fileExists)
    if (fileExists) {
        return createReadStream(filePath)
    }

    const url = `https://www.moex.com/ru/forts/contractbaseresults-exp.aspx?day1=${derivativeDayRange.startDay}&day2=${derivativeDayRange.endDay}&base=${derivativeDayRange.code}`

    console.log('getLocalOrFetchFile, start fetch file', url)
    const fetchDataPromise = new Promise((resolve, reject) => {
        https.get(url, { headers: userAgentHeaders }, function (res) {
            (res.pipe(iconv.decodeStream('windows-1251')) as any).collect(function (err, decodedBody) {
                if (err) {
                    reject(err)
                    return
                }
                fs.writeFileSync(filePath, decodedBody.replace(/<br>/g, ''))
                resolve(true)
            });
        });
    })

    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
            reject()
        }, 10000)
    })

    await Promise.race([fetchDataPromise, timeoutPromise])
    console.log('getLocalOrFetchFile, done fetch file')


    return getLocalOrFetchFile(derivativeDayRange)

}

async function getDataByDayRange(derivativeDayRange: DerivativeDayRangeType) {
    try {
        const dataRaw = await getLocalOrFetchFile(derivativeDayRange)

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
        return getDataByDayRange(derivativeDayRange)
    }
}

type DaysRangeResult = { startDay: DateWithFormatted, endDay: DateWithFormatted, }
async function daysRangeArrayGenerator(range): Promise<DaysRangeResult[]> {
    const daysArr: DaysRangeResult[] = []
    for (let i = 0; i < range; i++) {
        const startDay = moment().subtract(i, 'month')
            .startOf('month')
            .set("hour", 0)
            .set("minute", 0)
            .set("second", 0)
            .set("millisecond", 0)
            .utc(true)
            .toISOString()
        const endDay = moment().subtract(i, 'month')
            .endOf('month')
            .set("hour", 0)
            .set("minute", 0)
            .set("second", 0)
            .set("millisecond", 0)
            .utc(true)
            .toISOString()

        const priceDataExists = await prismaClient.derivative_prices.findFirst({
            where: {
                date: { lt: endDay }
            }
        })
        if (priceDataExists) {
            break
        }


        daysArr.push({
            startDay: {
                date: moment(startDay).utc(false),
                formatted: moment(startDay).utc(true).format(CSV_DOCUMENT_DATE_FORMAT)
            },
            endDay: {
                date: moment(endDay).utc(false),
                formatted: moment(endDay).utc(true).format(CSV_DOCUMENT_DATE_FORMAT)
            }
        })
    }
    return daysArr
}


export async function createTradeData(): Promise<void> {
    try {
        const daysRangeArr = await daysRangeArrayGenerator(3)
        const derivatives = await prismaClient.derivative.findMany({})

        for (const range of daysRangeArr) {
            for (const derivative of derivatives) {

                const rawData = await getDataByDayRange({
                    startDay: range.startDay.formatted,
                    endDay: range.endDay.formatted,
                    code: derivative.short_code
                })

                // TODO пока не делал обработку если появятся данные за новые дни в текущем месяце

                if (!rawData.length) {
                    console.log('no data for', derivative)
                    continue
                }


                // console.log(`createDbData, start upsert`, derivative.isin)
                for (const row of rawData) {
                    const formatted = derivativesPriceMapper(row, derivative.id)

                    await prismaClient.derivative_prices.upsert({
                        where: {
                            derivatives_date_unique: {
                                derivative_id: formatted.derivative_id,
                                date: formatted.date,
                            }
                        },
                        create: formatted,
                        update: formatted
                    })
                }
                // console.log('createDbData, end upsert')


            }

        }
    } catch (e) {
        console.log(999, e)
    }

}

