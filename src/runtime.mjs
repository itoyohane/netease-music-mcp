// Keep upstream diagnostics away from MCP stdout and redact session-bearing text.
console.log = () => {};
console.info = () => {};
console.debug = () => {};
console.warn = () => {};
console.error = () => {};
const {default: api} = await import('@neteasecloudmusicapienhanced/api');
const {Music} = await import('./core.mjs');
export const music = new Music(api);
