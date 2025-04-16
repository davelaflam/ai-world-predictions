import { DebugLevel } from './DebugLevel.js'
import { ITrackable } from './ITrackable.js'
import { LogType } from './LogType.js'

export interface ILog extends ITrackable {
  data?: any
  level?: DebugLevel
  title: string
  type: LogType
}
