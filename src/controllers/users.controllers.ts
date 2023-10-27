import { Request, Response } from 'express'
import { RegisterReqBody } from '~/models/requests/User.requests'
import User from '~/models/schemas/User.schema'
import databaseService from '~/services/database.services'
import usersService from '~/services/users.services'
import { ParamsDictionary } from 'express-serve-static-core'
import { ObjectId } from 'mongodb'
import { USERS_MESSAGES } from '~/constants/messages'
export const loginController = async (req: Request, res: Response) => {
  //nếu nó vào được đây thì nghĩa là đã qua được validate nghĩa là email và password đã đúng => đã đăng nhập thành công
  const user = req.user as User //đã qua được validate nghĩa là req.user đã được định nghĩa

  const user_id = user._id as ObjectId
  //server phải tạo ra access token và refresh token để gửi về cho client
  const result = await usersService.login(user_id.toString()) //tạo ra access token và refresh token
  return res.json({
    message: USERS_MESSAGES.LOGIN_SUCCESS,
    result
  })
}

export const registerController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
  const result = await usersService.register(req.body)
  return res.json({
    message: USERS_MESSAGES.REGISTER_SUCCESS,
    result
  })
}
