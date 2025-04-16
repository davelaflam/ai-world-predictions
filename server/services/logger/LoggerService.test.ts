// Mock stringify before importing LoggerService
jest.mock('safe-stable-stringify', () => ({
  __esModule: true, // Required for proper mocking of ES Modules
  default: jest.fn((data) => JSON.stringify(data)),
}))

import { LoggerService } from './LoggerService'

// Use require to properly import default export for mocking
const stringifyMock = require('safe-stable-stringify').default

describe('LoggerService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'info').mockImplementation(() => {})
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})

    // Reset the areDebugLogsOn static property before each test
    LoggerService.areDebugLogsOn = process.env.VERBOSE === 'true'
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Static Methods', () => {
    describe('info()', () => {
      it('should log info messages', async () => {
        const result = await LoggerService.info('Test info message')
        expect(result).toBe(true)
        expect(console.info).toHaveBeenCalledWith(expect.stringContaining('ℹ️ Test info message'))
      })

      it('should log info messages with data', async () => {
        const data = { key: 'value' }
        const result = await LoggerService.info('Info with data', data)
        expect(result).toBe(true)
        expect(console.info).toHaveBeenCalledWith(expect.stringContaining('ℹ️ Info with data'))
      })
    })

    describe('error()', () => {
      it('should log error messages', async () => {
        const result = await LoggerService.error('Test error message')
        expect(result).toBe(true)
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining('🆘 Test error message'))
      })

      it('should log error messages with data', async () => {
        const data = { error: 'Something went wrong' }
        const result = await LoggerService.error('Error with data', data)
        expect(result).toBe(true)
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining('🆘 Error with data'))
      })
    })

    describe('warning()', () => {
      it('should log warning messages', async () => {
        const result = await LoggerService.warning('Test warning message')
        expect(result).toBe(true)
        expect(console.info).toHaveBeenCalledWith(expect.stringContaining('⚠️ Test warning message'))
      })

      it('should log warning messages with data', async () => {
        const data = { warning: 'Be careful!' }
        const result = await LoggerService.warning('Warning with data', data)
        expect(result).toBe(true)
        expect(console.info).toHaveBeenCalledWith(expect.stringContaining('⚠️ Warning with data'))
      })
    })

    describe('debug()', () => {
      it('should not log debug messages when VERBOSE is false', async () => {
        process.env.VERBOSE = 'false'
        LoggerService.areDebugLogsOn = false
        const result = await LoggerService.debug('Test debug message')
        expect(result).toBe(true)
        expect(console.log).not.toHaveBeenCalled()
      })

      it('should log debug messages when VERBOSE is true', async () => {
        process.env.VERBOSE = 'true'
        LoggerService.areDebugLogsOn = true

        jest.spyOn(console, 'log').mockImplementation(() => {})

        const result = await LoggerService.debug('Test debug message')

        await new Promise((resolve) => setImmediate(resolve)) // Flush pending promises

        expect(result).toBe(true)
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('🐛 Test debug message'))
      })
    })

    describe('_logData()', () => {
      it('should return false for empty data', async () => {
        const emptyObjectResult = await LoggerService['_logData']({})
        const emptyArrayResult = await LoggerService['_logData']([])
        const nullResult = await LoggerService['_logData'](null)
        const undefinedResult = await LoggerService['_logData'](undefined)

        expect(emptyObjectResult).toBe(false)
        expect(emptyArrayResult).toBe(false)
        expect(nullResult).toBe(false)
        expect(undefinedResult).toBe(false)
        expect(console.info).not.toHaveBeenCalled()
      })

      it('should log stringified data', async () => {
        const data = { key: 'value' }
        const result = await LoggerService['_logData'](data)
        expect(result).toBe(true)
        expect(console.info).toHaveBeenCalledWith(expect.stringContaining('{"key":"value"}'))
      })

      it('should handle array data', async () => {
        const data = ['item1', 'item2']
        const result = await LoggerService['_logData'](data)
        expect(result).toBe(true)
        expect(console.info).toHaveBeenCalledWith(expect.stringContaining('["item1","item2"]'))
      })

      it('should handle string data', async () => {
        const data = 'This is a string'
        const result = await LoggerService['_logData'](data)
        expect(result).toBe(true)
        expect(console.info).toHaveBeenCalledWith(expect.stringContaining('This is a string'))
      })

      it('should return false and log error on stringify failure', async () => {
        stringifyMock.mockImplementationOnce(() => {
          throw new Error('Stringify Error')
        })

        const circularObject: any = {}
        circularObject.self = circularObject

        const result = await LoggerService['_logData'](circularObject)
        expect(result).toBe(false)
        expect(console.error).toHaveBeenCalledWith('Failed to log some data', expect.any(Error))
      })
    })
  })

  describe('Instance Methods', () => {
    let logger: LoggerService

    beforeEach(() => {
      logger = new LoggerService()
    })

    describe('debug()', () => {
      it('should return true for debug()', async () => {
        process.env.VERBOSE = 'true'
        LoggerService.areDebugLogsOn = true
        const result = await logger.debug('Instance debug', { key: 'value' })
        expect(result).toBe(true)
      })

      it('should return true for empty, null, and undefined data', async () => {
        process.env.VERBOSE = 'true'
        LoggerService.areDebugLogsOn = true

        const emptyResult = await logger.debug('Empty data', {})
        const nullResult = await logger.debug('Null data', null)
        const undefinedResult = await logger.debug('Undefined data', undefined)

        await new Promise((resolve) => setImmediate(resolve)) // Flush pending promises

        expect(emptyResult).toBe(true)
        expect(nullResult).toBe(true)
        expect(undefinedResult).toBe(true)
      })
    })
  })
})
