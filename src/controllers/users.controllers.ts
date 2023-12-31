import { NextFunction, Request, Response } from 'express'
import {
  ChangePasswordReqBody,
  FollowReqBody,
  GetProfileReqParams,
  LoginReqBody,
  LogoutReqBody,
  RefreshTokenReqBody,
  RegisterReqBody,
  ResetPasswordReqBody,
  TokenPayload,
  UnfollowReqParams,
  UpdateMeReqBody
} from '~/models/requests/User.requests'
import User from '~/models/schemas/User.schema'
import databaseService from '~/services/database.services'
import usersService from '~/services/users.services'
import { ParamsDictionary } from 'express-serve-static-core'
import { ObjectId } from 'mongodb'
import { USERS_MESSAGES } from '~/constants/messages'
import { UserVerifyStatus } from '~/constants/enums'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import exp from 'constants'

export const loginController = async (req: Request<ParamsDictionary, any, LoginReqBody>, res: Response) => {
  //nếu nó vào được đây thì nghĩa là đã qua được validate nghĩa là email và password đã đúng => đã đăng nhập thành công
  const user = req.user as User //đã qua được validate nghĩa là req.user đã được định nghĩa

  const user_id = user._id as ObjectId
  //server phải tạo ra access token và refresh token để gửi về cho client
  const result = await usersService.login({ user_id: user_id.toString(), verify: user.verify }) //tạo ra access token và refresh token
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

export const logoutController = async (req: Request<ParamsDictionary, any, LogoutReqBody>, res: Response) => {
  const { refresh_token } = req.body
  //logout sẽ nhận refresh token để tìm và xóa
  const result = await usersService.logout(refresh_token)
  res.json(result)
}

export const emailVerifyController = async (req: Request, res: Response) => {
  //kiểm tra user đã verify hay chưa
  const { user_id } = req.decoded_email_verify_token as TokenPayload
  const user = req.user as User
  if (user.verify === UserVerifyStatus.Verified) {
    return res.json({
      message: USERS_MESSAGES.EMAIL_ALREADY_VIRIFIED_BEFORE
    })
  }
  //nếu mà xuống đc đây nghĩa là user này chưa verify, chưa bị banned, và khớp mã
  //mình tiến hành update: verify: 1, xóa email_verify_token, update_at
  const result = await usersService.verifyEmail(user_id)
  return res.json({
    message: USERS_MESSAGES.EMAIL_VERIFY_SUCCESS,
    result
  })
}

export const resendEmailVerifyController = async (req: Request, res: Response) => {
  //nếu code vào đc đây nghĩa là đã đi qua đc accesstokenValidator
  //trong req sẽ có decoded_authorization
  const { user_id } = req.decoded_authorization as TokenPayload
  //lấy user từ database
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
  if (!user) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.USER_NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND
    })
  }
  //nếu có thì kiểm tra xem thằng này đã bị banned chưa
  if (user.verify === UserVerifyStatus.Banned) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.USER_BANNED,
      status: HTTP_STATUS.FORBIDDEN
    })
  }
  //user đã verify chưa?
  if (user.verify === UserVerifyStatus.Verified) {
    return res.json({
      message: USERS_MESSAGES.EMAIL_ALREADY_VIRIFIED_BEFORE
    })
  }
  //nếu chưa verify thì tiến hành update cho user mã mới
  const result = await usersService.resendEmailVerify(user_id)
  return res.json(result)
}

export const forgotPasswordController = async (req: Request, res: Response) => {
  //lấy user_id từ req.user
  const { _id, verify } = req.user as User
  //tiến hành update lại forgot_password_token
  const result = await usersService.forgotPassword({
    user_id: (_id as ObjectId).toString(),
    verify
  })
  return res.json(result)
}

export const verifyForgotPasswordTokenController = async (req: Request, res: Response) => {
  return res.json({
    message: USERS_MESSAGES.VERIFY_FORGOT_PASSWORD_TOKEN_SUCCESS
  })
}

export const resetPasswordController = async (
  req: Request<ParamsDictionary, any, ResetPasswordReqBody>,
  res: Response
) => {
  //muốn đổi mật khẩu thì cần user_id và password mới
  const { user_id } = req.decoded_forgot_password_token as TokenPayload
  const { password } = req.body
  //tiến hành update lại password
  const result = await usersService.resetPassword({ user_id, password })
  return res.json(result)
}

export const getMeController = async (req: Request, res: Response) => {
  //muốn lấy profile của mình thì cần user_id của mình
  const { user_id } = req.decoded_authorization as TokenPayload
  //dùng user_id để lấy user từ database
  const user = await usersService.getMe(user_id)
  return res.json({
    message: USERS_MESSAGES.GET_ME_SUCCESS,
    result: user
  })
}

export const updateMeController = async (req: Request<ParamsDictionary, any, UpdateMeReqBody>, res: Response) => {
  //muốn update thì cần user_id và những cái cần update
  const { user_id } = req.decoded_authorization as TokenPayload
  const { body } = req
  //update lại user
  const result = await usersService.updateMe(user_id, body)
  return res.json({
    message: USERS_MESSAGES.UPDATE_ME_SUCCESS,
    result
  })
}

export const getProfileController = async (req: Request<GetProfileReqParams>, res: Response) => {
  //tìm user theo username
  const { username } = req.params
  const user = await usersService.getProfile(username)
  return res.json({
    message: USERS_MESSAGES.GET_PROFILE_SUCCESS,
    result: user
  })
}

export const followController = async (
  req: Request<ParamsDictionary, any, FollowReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload //lấy user_id từ decoded_authorization của access_token
  const { followed_user_id } = req.body //lấy followed_user_id từ req.body
  const result = await usersService.follow(user_id, followed_user_id) //chưa có method này
  return res.json(result)
}

export const unfollowController = async (req: Request<UnfollowReqParams>, res: Response, next: NextFunction) => {
  //lấy ra user_id người muốn thực hiện hành động unfollow
  const { user_id } = req.decoded_authorization as TokenPayload
  //lấy ra người mà mình muốn unffollow
  const { user_id: followed_user_id } = req.params
  //gọi hàm unfollow
  const result = await usersService.unfollow(user_id, followed_user_id)
  return res.json(result)
}

export const changePasswordController = async (
  req: Request<ParamsDictionary, any, ChangePasswordReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { password } = req.body
  const result = await usersService.changePassword(user_id, password)
  return res.json(result)
}

export const refreshTokenController = async (
  req: Request<ParamsDictionary, any, RefreshTokenReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { refresh_token } = req.body
  const { user_id, verify } = req.decoded_refresh_token as TokenPayload
  const result = await usersService.refreshToken({ user_id, verify, refresh_token })
  return res.json({
    message: USERS_MESSAGES.REFRESH_TOKEN_SUCCESS,
    result
  })
}

export const oAuthController = async (req: Request, res: Response, next: NextFunction) => {
  const { code } = req.query
  const { access_token, refresh_token, new_user } = await usersService.oAuth(code as string)
  const urlRedirect = `${process.env.CLIENT_REDIRECT_CALLBACK}?access_token=${access_token}&refresh_token=${refresh_token}&new_user=${new_user}`
  return res.redirect(urlRedirect)
}
