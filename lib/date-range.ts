const toDateStr = (d:Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const toEpochSec = (dateStr: string) => Math.floor(new Date(dateStr).getTime()/1000)


export function getDefaultDateRange(days=7){
    const now = new Date()
    return{
        todayStr: toDateStr(now),
        weekAgoStr: toDateStr(new Date(now.getTime() - days * 86400 * 1000))
    }
}

export function formatDateTime(epochSec: number|null|undefined){

    if(!epochSec) return '-'
    const d = new Date(epochSec * 1000)
    return `${toDateStr(d)} ${String(d.getMonth()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}