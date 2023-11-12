// https://www.moex.com/ru/derivatives/open-positions-csv.aspx?d=20220125&t=1
import https from 'https'
import csv from 'csv-parser'
import moment from "moment";
import { DerivativeModel, MatchDerivativeModel } from './models';
import { contractTypes } from './constants';
import * as path from 'path'
import { access } from 'fs/promises'
import { createWriteStream, createReadStream, ReadStream } from 'fs'

const CSV_DOCUMENT_DATE_FORMAT = 'YYYYMMDD'

const parseFloatOrReturnNull = (strNum) => parseFloat(strNum) || null

type DateWithFormatted = {
    formatted: string,
    date: moment.Moment
}

function derivativesMapper(rawDerivative) {
    return {
        date: moment(rawDerivative['date']).utc(true).toDate(),
        isin: rawDerivative.isin,
        name: rawDerivative.name,
        contract_type: rawDerivative.contract_type,
        iz_fiz: !!rawDerivative.iz_fiz,
        clients_in_long: parseFloatOrReturnNull(rawDerivative.clients_in_long),
        clients_in_short: parseFloatOrReturnNull(rawDerivative.clients_in_short),
        short_position: parseFloatOrReturnNull(rawDerivative.short_position),
        long_position: parseFloatOrReturnNull(rawDerivative.long_position),
        change_prev_week_short_abs: parseFloatOrReturnNull(rawDerivative.change_prev_week_short_abs),
        change_prev_week_long_abs: parseFloatOrReturnNull(rawDerivative.change_prev_week_long_abs),
        change_prev_week_short_perc: parseFloatOrReturnNull(rawDerivative.change_prev_week_short_perc),
        change_prev_week_long_perc: parseFloatOrReturnNull(rawDerivative.change_prev_week_long_perc),
    }
}
process.on('uncaughtException', (e) => {
    console.log(e.message, e.name, e.stack)
})

function matchDerivativesByDate(date: Date, isin: string, fiz, legal) {
    const contractType = contractTypes.futures

    const legalLongToFizLong = (((legal?.long_position || 0) / (fiz?.long_position || 0)) || 0).toFixed(2)
    const legalShortToFizShort = (((legal?.short_position || 0) / (fiz?.short_position || 0)) || 0).toFixed(2)

    const legalShortToFizLong = (((legal?.short_position || 0) / (fiz?.long_position || 0)) || 0).toFixed(2)
    const legalLongToFizShort = (((legal?.long_position || 0) / (fiz?.short_position || 0)) || 0).toFixed(2)

    const data = {
        date: date,
        isin: isin,
        contract_type: contractType,
        fizModel: fiz?._id,
        legalModel: legal?._id,
        legalLongToFizLong,
        legalShortToFizShort,
        legalShortToFizLong,
        legalLongToFizShort,
    }

    return data
    // await MatchDerivativeModel.updateOne({
        // date: data.date,
        // isin: data.isin,
        // contract_type: data.contract_type
    // }, data, { upsert: true })
    // }
}


export async function createDbData() {
    try {
        const daysArr = await dataArrayGenerator(365)
        for (const day of daysArr) {
            const data = await getDataByDay(day.formatted)

            if (!data.length) continue
            const formatted = data.map(derivativesMapper)

            const couples: {
                [isin: string]: {
                    [contractType: string]: {
                        fiz?: Record<string, unknown>,
                        legal?: Record<string, unknown>
                    }
                }
            } = {}
            const bulkDerivativeOps = []
            for (const row of formatted) {
                // couples
                if (!couples[row.isin]) {
                    couples[row.isin] = {}
                }
                if (!couples[row.isin][row.contract_type]) {
                    couples[row.isin][row.contract_type] = {}
                }
                const fizOrLegal = row.iz_fiz ? 'fiz' : 'legal'
                couples[row.isin][row.contract_type][fizOrLegal] = row

                // bulk ops
                bulkDerivativeOps.push({
                    updateOne: {
                        filter: {
                            date: row.date,
                            isin: row.isin,
                            iz_fiz: row.iz_fiz,
                            contract_type: row.contract_type
                        },
                        update: { $set: row },
                        upsert: true
                    }
                })
            }
            await DerivativeModel.bulkWrite(bulkDerivativeOps);
            console.log('fetchData, bulkDerivativeOps done')

            const bulkMatchOps = []
            for (const isin in couples) {
                const result =  matchDerivativesByDate(day.date.toDate(), isin, couples[isin]?.[contractTypes.futures].fiz, couples[isin]?.[contractTypes.futures].legal)

                bulkMatchOps.push({
                    updateOne: {
                        filter: {
                            date: result.date,
                            isin: result.isin,
                            contract_type: result.contract_type
                        },
                        update: { $set: result },
                        upsert: true
                    }
                })
            }
            await MatchDerivativeModel.bulkWrite(bulkMatchOps);
            console.log('fetchData, bulkMatchOps done')
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
        const docsExist = await DerivativeModel.findOne({ date: date })
        if (docsExist) break
        daysArr.push({
            date: moment(date).utc(false),
            formatted: moment(date).utc(true).format(CSV_DOCUMENT_DATE_FORMAT)
        })
    }
    return daysArr
}

async function getLocalOrFetchFile(day: string): Promise<ReadStream> {
    const filePath = path.join(__dirname, './derivatives_files', `${day}.csv`)
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
