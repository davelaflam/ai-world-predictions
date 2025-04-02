import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { LoggerService } from '../../services/logger/LoggerService.js'

// ✅ Fix __dirname for ES Modules (since it's not available by default)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Append JSON data to an existing file or create a new one.
 */
export function saveJsonPretty(data: any, filename: string): void {
  try {
    const filePath = path.join(__dirname, '../outputs', filename)

    // ✅ Ensure directory exists
    const outputDir = path.dirname(filePath)
    if (!fs.existsSync(outputDir)) {
      LoggerService.info(`Creating output directory: ${outputDir}`)
      fs.mkdirSync(outputDir, { recursive: true })
    }

    if (!fs.existsSync(filePath)) {
      LoggerService.info(`Creating new JSON file: ${filePath}`)
    }

    let existingData: any[] = []
    if (fs.existsSync(filePath)) {
      try {
        existingData = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
        if (!Array.isArray(existingData)) {
          existingData = [existingData]
        }
      } catch {
        LoggerService.warning(`Invalid JSON format in ${filePath}, starting fresh.`)
      }
    }

    if (Array.isArray(data)) {
      existingData.push(...data)
    } else {
      existingData.push(data)
    }

    fs.writeFileSync(filePath, JSON.stringify(existingData, null, 4))
    LoggerService.info(`✅ Successfully updated ${filename}`)
  } catch (error) {
    LoggerService.error(`🆘 Error saving JSON: ${error}`)
  }
}
