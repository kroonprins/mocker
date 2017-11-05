import express from 'express'
import bodyParser from 'body-parser'
import 'express-async-errors'

import { logger } from './logging'
import { ProjectService } from './project-service'

const _listProjects = async (req, res) => {
  const allProjects = await ProjectService.listAllProjects()
  res.send(allProjects)
}

const _listRules = async (req, res) => {
  const rules = await ProjectService.listRules(req.params.projectName)
  res.send(rules)
}

const _retrieveRule = async (req, res) => {
  const rules = await ProjectService.retrieveRule(req.params.projectName, req.params.ruleName)
  res.send(rules)
}

class ApiServer {
  constructor (port) {
    this.port = port
    this.server = null
  }

  start () {
    logger.debug('Starting api server on port %s', this.port)

    const app = express()
    app.use(bodyParser.json())
    app.disable('x-powered-by')
    const router = express.Router()

    router.get('/projects', _listProjects)
    router.get('/rules/:projectName', _listRules)
    router.get('/rules/:projectName/:ruleName', _retrieveRule)

    app.use('/api', router)

    return new Promise((resolve, reject) => {
      this.server = app.listen(this.port, () => {
        logger.info('Api server started on port %d', this.port)
        resolve()
      })
    })
  }
  stop () {
    logger.debug('Request to stop the api server')
    if (this.server != null) {
      logger.info('Stopping the api server')
      return new Promise((resolve, reject) => {
        this.server.close(() => {
          logger.info('Stopped the api server')
          resolve()
        })
      })
    }
  }
}

export {
  ApiServer
}
