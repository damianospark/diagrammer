// Auth types
export * from './auth'

// Billing types
export * from './billing'

// Organization types
export * from './organization'

// Audit types
export * from './audit'

// Feature flag types
export * from './feature-flag'

// Common types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = any> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface SearchParams {
  q?: string
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
  filters?: Record<string, any>
}

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface TableColumn<T = any> {
  key: keyof T
  title: string
  sortable?: boolean
  filterable?: boolean
  render?: (value: any, record: T) => React.ReactNode
}

export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'date' | 'file'
  required?: boolean
  placeholder?: string
  options?: SelectOption[]
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
}

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  createdAt: Date
}

export interface Breadcrumb {
  label: string
  href?: string
  current?: boolean
}

export interface MenuItem {
  id: string
  label: string
  href?: string
  icon?: React.ComponentType<{ className?: string }>
  children?: MenuItem[]
  badge?: string | number
  disabled?: boolean
  external?: boolean
}

export interface StatsCard {
  title: string
  value: string | number
  change?: {
    value: number
    type: 'increase' | 'decrease'
    period: string
  }
  icon?: React.ComponentType<{ className?: string }>
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
}

export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string | string[]
    borderWidth?: number
  }[]
}

export interface ExportOptions {
  format: 'csv' | 'json' | 'xlsx' | 'pdf'
  filename?: string
  includeHeaders?: boolean
  dateRange?: {
    start: Date
    end: Date
  }
  filters?: Record<string, any>
}

export interface ImportOptions {
  format: 'csv' | 'json' | 'xlsx'
  file: File
  mapping?: Record<string, string>
  skipFirstRow?: boolean
  validate?: boolean
}

export interface FileUpload {
  id: string
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  url?: string
  error?: string
}

export interface WebSocketMessage {
  type: string
  data: any
  timestamp: Date
  userId?: string
  orgId?: string
}

export interface SystemStatus {
  status: 'healthy' | 'degraded' | 'down'
  services: {
    database: 'up' | 'down'
    redis: 'up' | 'down'
    stripe: 'up' | 'down'
    email: 'up' | 'down'
    storage: 'up' | 'down'
  }
  uptime: number
  lastCheck: Date
  version: string
}

export interface HealthCheck {
  name: string
  status: 'healthy' | 'unhealthy'
  responseTime: number
  lastCheck: Date
  error?: string
  metadata?: Record<string, any>
}
