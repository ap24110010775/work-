import morgan from 'morgan';

// We can define custom morgan formats or use the 'dev' format
export const requestLogger = morgan((tokens, req, res) => {
  return [
    `[${req.requestId || 'NO-REQ-ID'}]`,
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    tokens.res(req, res, 'content-length'), '-',
    tokens['response-time'](req, res), 'ms'
  ].join(' ');
});
