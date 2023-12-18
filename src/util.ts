import { consola } from 'consola';

// Silence logging by default.
consola.level = -999;

/**
 * Attempts to guess the caller of a function by going through a local stack
 * trace.
 * @param thisArg The function that was called.
 */
// eslint-disable-next-line @typescript-eslint/ban-types -- there is not better/narrower type definition.
export function guessCaller(thisArg: Function): string {
  // consola.debug(`Trying to guess caller for "${thisArg.name}"`);
  // Store current stack trace limit so it can be restored.
  const previousStacktraceLimit = Error.stackTraceLimit;
  const previousStackTracePreparer = Error.prepareStackTrace;

  Error.stackTraceLimit = 5;

  // Error.prepareStackTrace = (err, stack): NodeJS.CallSite[] => stack.filter(OurFilesFilter);
  Error.prepareStackTrace = (err, stack): NodeJS.CallSite[] => stack;

  const captureObject: { stack?: NodeJS.CallSite[] } = {};

  Error.captureStackTrace(captureObject, thisArg);

  if (!captureObject.stack) {
    throw new Error('No stack was returned!!');
  }

  const stack = captureObject.stack;

  // consola.debug('----');
  // consola.debug(stack.map(s => `${s.getFileName()}, line ${s.getLineNumber()}, ${s.getFunctionName() || s.getFunction()?.name}`));
  // consola.debug('----');

  // Restore original stack trace limit.
  Error.stackTraceLimit = previousStacktraceLimit;
  Error.prepareStackTrace = previousStackTracePreparer;

  if (stack.length < 1) {
    // throw new Error('Stack has too few rows!');
    return `${thisArg.name}[?]`;
  } else {
    return getFullFunctionName(stack[0]);
  }
}

export function getFullFunctionName(callSite: NodeJS.CallSite): string {
  const typeName = callSite.getTypeName();
  if (typeName === null) {
    const fnName = callSite.getFunctionName();
    
    if (fnName !== null) return fnName;
  } else {
    const mtName = callSite.getMethodName();

    if (mtName !== null) return `${typeName}.${mtName}`;
  }

  return `ANONYMOUS (function: ${callSite.getFunctionName()}), (method: ${callSite.getMethodName()}), (type: ${callSite.getTypeName()})`;
}

export function toArray<T>(value: T | T[]): T[] {
  return Array.isArray(value)
    ? value
    : [value];
}
