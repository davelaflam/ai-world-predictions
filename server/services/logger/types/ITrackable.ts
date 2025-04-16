export interface ITrackable {
  id?: string

  isActive?: boolean

  createdAt?: Date | string
  createdBy?: string
  deletedAt?: Date | string
  deletedBy?: any
  updatedAt?: Date | string
  updatedBy?: any
}

export type Saved<TData extends ITrackable> = Omit<TData, 'id'> & {
  id: string
}
