// @ts-ignore
import * as pRetryModule from 'p-retry-real';

/**
 * Wrapper para p-retry que soluciona problemas de exportación en entornos Vite/ESM
 * Maneja la estructura de exportación de CommonJS de p-retry.
 */
const pRetry = pRetryModule.default || pRetryModule;

export const AbortError = pRetryModule.AbortError || (pRetry as any).AbortError || Error;
export const retry = pRetry;

export default pRetry;

