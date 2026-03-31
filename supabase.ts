// This file acts as a ponyfill for the 'cross-fetch' library.
// It ensures that any part of the application that tries to import 'cross-fetch'
// will instead receive the browser's native fetch implementation.
// This is a definitive, code-level fix for the persistent bundling issue.

export const fetch = window.fetch;
export const Request = window.Request;
export const Response = window.Response;
export const Headers = window.Headers;
export default fetch;
