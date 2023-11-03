import { NextFunction, RequestHandler, Request, Response } from 'express'

//wrapAsync: hàm dùng để bao bọc async
export const wrapAsync = <P>(func: RequestHandler<P>) => {
  return async (req: Request<P>, res: Response, next: NextFunction) => {
    //async là promise nên phải có await
    try {
      await func(req, res, next)
    } catch (error) {
      next(error)
    }
  }
}
