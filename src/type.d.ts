//file này dùng để định nghĩa lại request truyền lên từ client
import { Request } from 'express'

declare module 'express' {
  interface Request {
    user?: User //trong 1 request có thể có hoặc không có user
    decoded_authorization?: TokenPayload
    decoded_refresh_token?: TokenPayload
    decoded_email_verify_token?: TokenPayload
    decoded_forgot_password_token?: TokenPayload
  }
}
