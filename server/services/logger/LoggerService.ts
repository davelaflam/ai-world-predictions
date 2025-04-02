import stringify from 'safe-stable-stringify'
import dotenv from 'dotenv'

import { DebugLevel, LogType } from './types/index.js'
import { Log } from './types/index.js'

dotenv.config()

export { DebugLevel }

export class LoggerService {
  // set the debug logs if VERBOSE environment variable is present
  static areDebugLogsOn: boolean = process.env.VERBOSE === 'true'
  static logs: Log[] = []

  /**
   * @description debug log (Instance)
   * @param title the title of the log message.
   * @param data optional data object to print out.
   * @param level the service level of the log.
   * @memberof LoggerService
   */
  public async debug(
    title: string,
    data: string | object | [] | undefined | null = {},
    level: DebugLevel = DebugLevel.SERVICE
  ): Promise<boolean> {
    return await LoggerService.debug(title, data, level)
  }

  /**
   * @description error log (Instance)
   * @param title the title of the log message
   * @param data optional data
   * @memberof LoggerService
   */
  public async error(title: string, data: string | object | [] | undefined | null = {}): Promise<boolean> {
    return await LoggerService.error(title, data)
  }

  /**
   * @description info log (Instance)
   * @param title the title of the log.
   * @param data some optional data.
   * @memberof LoggerService
   */
  public async info(title: string, data: string | object | [] | undefined | null = {}): Promise<boolean> {
    return await LoggerService.info(title, data)
  }

  /**
   * @description warning log (Instance)
   * @param title the title of the log message.
   * @param data optional data object to print out.
   * @memberof LoggerService
   */
  public async warning(title: string, data: string | object | [] | undefined | null = {}): Promise<boolean> {
    return LoggerService.warning(title, data)
  }

  /**
   * @description debug log (Static)
   * @param title the title of the log
   * @param data some optional data.
   * @param level the service level of the log.
   * @memberof LoggerService
   */
  public static async debug(
    title: string,
    data: string | object | [] | undefined | null = {},
    level: DebugLevel = DebugLevel.SERVICE
  ): Promise<boolean> {
    if (!this.areDebugLogsOn) {
      return true
    }

    this.logs.push(new Log({ level, title, data, type: LogType.DEBUG }))

    console.log(`🐛 ${title}`)

    // Explicitly check the return value of _logData and return true regardless
    await this._logData(data)
    return true
  }

  /**
   * @description error log (Static)
   * @param {string} title the title of the log message
   * @param {string|object} data additional data
   * @memberof LoggerService
   */
  public static async error(title: string, data?: string | object | [] | undefined | null): Promise<boolean> {
    this.logs.push(new Log({ title, data, type: LogType.ERROR }))

    console.error(`🆘 ${title}`)
    this._logData(data)

    return true
  }

  /**
   * @description info log (Static)
   * @param {string} title the title of the log message
   * @param {string|object} data additional data
   * @memberof LoggerService
   */
  public static async info(title: string, data?: string | object | [] | undefined | null): Promise<boolean> {
    this.logs.push(new Log({ title, data, type: LogType.INFO }))

    console.info(`ℹ️ ${title}`)
    this._logData(data)

    return true
  }

  /**
   * @description warning log (Static)
   * @param title the title of the log message.
   * @param data optional data object to print out.
   * @memberof LoggerService
   */
  public static async warning(title: string, data: string | object | [] | undefined | null = {}): Promise<boolean> {
    this.logs.push(new Log({ title, data, type: LogType.WARNING }))

    console.info(`⚠️ ${title}`)
    this._logData(data)

    return true
  }

  /**
   * @description Handles the logging of data
   * @param data optional data object to print out.
   * @private
   */
  private static async _logData(data: string | object | [] | undefined | null = {}): Promise<boolean> {
    // Check for empty object, empty array, undefined, or null
    if (
      data === undefined ||
      data === null ||
      (typeof data === 'object' && !Array.isArray(data) && Object.keys(data || {}).length === 0) ||
      (Array.isArray(data) && data.length === 0)
    ) {
      return false
    }

    try {
      console.info(`     ${stringify(data)}`)
    } catch (error) {
      console.error('Failed to log some data', error)
      return false
    }

    return true
  }
}
