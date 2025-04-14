interface LogData {
  [key: string]: any;
}

class Logger {
  private static formatError(error: unknown): string {
    if (error instanceof Error) {
      return `${error.name}: ${error.message}\nStack: ${error.stack || 'No stack trace'}`;
    }
    return String(error);
  }

  private static formatData(data: LogData): string {
    return Object.entries(data)
      .map(([key, value]) => {
        if (value instanceof Error) {
          return `${key}: ${this.formatError(value)}`;
        }
        return `${key}: ${JSON.stringify(value)}`;
      })
      .join('\n');
  }

  static info(message: string, data: LogData = {}): void {
    console.log(`[INFO] ${message}\n${this.formatData(data)}`);
  }

  static error(message: string, error?: unknown, data: LogData = {}): void {
    const errorData = {
      ...data,
      timestamp: new Date().toISOString(),
      environment: import.meta.env.DEV ? 'development' : 'production',
      error: error ? this.formatError(error) : undefined
    };
    
    console.error(`[ERROR] ${message}\n${this.formatData(errorData)}`);
  }

  static debug(message: string, data: LogData = {}): void {
    if (import.meta.env.DEV) {
      console.debug(`[DEBUG] ${message}\n${this.formatData(data)}`);
    }
  }

  static warn(message: string, data: LogData = {}): void {
    console.warn(`[WARN] ${message}\n${this.formatData(data)}`);
  }
}

export default Logger;
