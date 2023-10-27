import { NextFunction, RequestHandler, Request, Response } from 'express'

//wrapAsync: hàm dùng để bao bọc async
export const wrapAsync = (func: RequestHandler) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    //async là promise nên phải có await
    try {
      await func(req, res, next)
    } catch (error) {
      next(error)
    }
  }
}
