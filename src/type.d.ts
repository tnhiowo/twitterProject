//file này dùng để định nghĩa lại request truyền lên từ client
import { Request } from 'express'

declare module 'express' {
  interface Request {
    user?: User //trong 1 request có thể có hoặc không có user
  }
}
