/**
 * Console logging utility with configurable verbosity levels
 */

export type LogLevel = 'none' | 'error' | 'warn' | 'info' | 'debug';

interface ConsoleLogger {
  error: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
  debug: (message: string, ...args: any[]) => void;
  setLevel: (level: LogLevel) => void;
  getLevel: () => LogLevel;
}

/**
 * Log level hierarchy - each level includes all levels above it
 */
const LOG_LEVELS = {
  none: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4
} as const;

class Logger implements ConsoleLogger {
  private currentLevel: LogLevel = 'info';

  setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  getLevel(): LogLevel {
    return this.currentLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] <= LOG_LEVELS[this.currentLevel];
  }

  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message), ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message), ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message), ...args);
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message), ...args);
    }
  }
}

// Create singleton logger instance
export const logger = new Logger();

// Export convenience methods for common usage patterns
export const logError = (message: string, ...args: any[]) => logger.error(message, ...args);
export const logWarn = (message: string, ...args: any[]) => logger.warn(message, ...args);
export const logInfo = (message: string, ...args: any[]) => logger.info(message, ...args);
export const logDebug = (message: string, ...args: any[]) => logger.debug(message, ...args);

// Export level constants for external use
export const LogLevels = LOG_LEVELS;