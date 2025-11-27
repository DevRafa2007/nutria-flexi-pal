/**
 * Utilitário para lidar com datas locais de forma consistente
 * Evita problemas de fuso horário ao comparar datas
 */

/**
 * Retorna a data local no formato YYYY-MM-DD
 * Usa timezone local ao invés de UTC para evitar problemas de fuso horário
 * @param date - Data a ser formatada (default: hoje)
 * @returns String no formato YYYY-MM-DD (ex: "2025-11-27")
 */
export function getLocalDateString(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Retorna a data de hoje no formato YYYY-MM-DD (timezone local)
 */
export function getTodayString(): string {
    return getLocalDateString(new Date());
}

/**
 * Retorna a data de ontem no formato YYYY-MM-DD (timezone local)
 */
export function getYesterdayString(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return getLocalDateString(yesterday);
}

/**
 * Compara se duas datas são do mesmo dia (ignora hora/minuto/segundo)
 */
export function isSameDay(date1: Date, date2: Date): boolean {
    return getLocalDateString(date1) === getLocalDateString(date2);
}

/**
 * Verifica se a data é hoje
 */
export function isToday(date: Date | string): boolean {
    const dateStr = typeof date === 'string' ? date : getLocalDateString(date);
    return dateStr === getTodayString();
}
