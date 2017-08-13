
'use strict'

const LogFilter = require('seneca-log-filter')

function get_level (str) {
  switch (str) {
    case 'quiet':
    case 'silent':
      return 'none'
    case 'any':
    case 'all':
    case 'print':
      return 'debug+'
    case 'test':
      return 'warn+'
    case 'standard':
    default:
      return 'info+'
  }
}

function preload () {
  const options = this.options()

  let log = options.log.basic || options.log || {level: 'info+'}
  if (typeof log === 'string') { log = {level: get_level(log)} }

  const logFilter = LogFilter(log)
  
  const logger = (context, payload) => {
    if (!logFilter(payload)) { return }


    let type = payload.level || '-'
    let kind = payload.kind || 'message'
    let text = payload.pattern || payload.notice || payload[0] || '-'
    let stack = null

    if (payload.err) {

      text = ''

      if (payload.err.orig && payload.err.orig.stack) {
        stack = payload.err.orig.stack
      }

      if (payload.err.code) {
        text += `${payload.err.code}: `
      }

      if (payload.err.orig && payload.err.orig.message) {
        text += ` ${payload.err.orig.message}`
      }

      if (payload.err.details && payload.err.details.args) {
        text += ` ${payload.err.details.args}`
      }

    }

    if (payload.options) {
      kind = 'options'
      text = JSON.stringify(payload.options)
    }

    console.log(
      new Date(payload.when).toJSON(),
      payload.seneca.padStart(50),
      kind.padStart(8),
      type.padStart(8),
      text
    )

    // for the IDE's sake
    if (stack) {
      console.error(stack)
    }

  }

  return {extend: {logger}}

}

module.exports = {preload}
