import type { Logger } from 'winston';

let winston: any;
try {
  winston = require('winston');
  console.debug(winston.config);

  if (Object.keys(winston.loggers.loggers).length === 0) {
    console.warn('Winston present, but there does not seem to be any loggers configured.');
    winston = undefined;
  }
} catch (_err: unknown) {
  console.log('winston is not installed. No logging will happen.');
}

type LoggerInstance = Pick<Logger, 'log'>;

const _Logger = winston || {
  log(level: string, msg: string): void {
    // Noop
    console.log('noop');
  },
  info(msg: string): void {
    // Noop
    console.log('noop');
  },
  debug(msg: string): void {
    // Noop
    console.log('noop');
  },
  verbose(msg: string): void {
    // Noop
    console.log('noop');
  },
  warn(msg: string): void {
    // Noop
    console.log('noop');
  },
}

export { _Logger as Logger }

/**
 * Attempts to guess the caller of a function by going through a local stack
 * trace.
 * @param thisArg The function that was called.
 */
// eslint-disable-next-line @typescript-eslint/ban-types -- there is not better/narrower type definition.
export function guessCaller(thisArg: Function): string {
  // console.debug(`Trying to guess caller for "${thisArg.name}"`);
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

  // console.debug('----');
  // console.debug(stack.map(s => `${s.getFileName()}, line ${s.getLineNumber()}, ${s.getFunctionName() || s.getFunction()?.name}`));
  // console.debug('----');

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

// --- WIP stuff.

function loggedMethod(logger?: LoggerInstance) {
  return function innerloggedMethod(originalMethod: any, context: ClassMethodDecoratorContext) {
    const methodName = String(context.name);
    
    function replacementMethod(this: any, ...args: any[]) {
      logger?.log('debug', methodName);
      const result = originalMethod.call(this, ...args, logger);
      return result;
    }
  
    return replacementMethod;
  }
}

class TestClass {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  speak(): void {
    console.log(`Hello, ${this.name}!`);
  }

  @loggedMethod(winston)
  speak2(): void {
    console.log(`Hello, ${this.name}!`);
  }
}

const t = new TestClass('World');

t.speak();

t.speak2();