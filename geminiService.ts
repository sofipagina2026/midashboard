/**
 * SafeFetchWrapper.ts
 * Interceptor de fetch para manejar headers de autenticación sin sobrescribir window.fetch
 */

// Guardamos una referencia al fetch original para evitar recursión
const nativeFetch = window.fetch.bind(window);

export const safeFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const headers = new Headers(init?.headers || {});
  
  const secureInit: RequestInit = {
    ...init,
    headers,
  };

  // Usamos la referencia guardada
  return nativeFetch(input, secureInit);
};

