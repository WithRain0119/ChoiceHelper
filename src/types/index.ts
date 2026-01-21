export interface Prize {
  code: string
  name: string
  probability: number
  originalIndex?: number
}

export interface LotteryConfig {
  id: string
  title: string
  prizes: Prize[]
  createdAt: string
  isSystem?: boolean
}

export interface LotteryRecord {
  id: string
  configId: string
  prize: Prize
  timestamp: string
}

export interface Feedback {
  id: number
  content: string
  timestamp: string
}

declare global {
  interface Window {
    showDirectoryPicker(options?: {
      mode?: 'read' | 'readwrite'
      startIn?: 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos'
    }): Promise<FileSystemDirectoryHandle>
  }
}

export {} 