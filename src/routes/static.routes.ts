import { Router } from 'express'
import { serverImageController } from '~/controllers/medias.controller'

const staticRouter = Router()

staticRouter.get('/image/:namefile', serverImageController)

export default staticRouter
