const isDev = process.env.NODE_ENV !== 'production';

export const logger = {
  debug: (...args) => isDev && console.log(...args),
  error: (...args) => console.error(...args),
};