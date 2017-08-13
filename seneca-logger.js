
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
    let text = null
    let stack = null

    // special case for mesh, showing add/remove. omit the last parameter of payload.
    if (payload.plugin_name === 'mesh' && ['add', 'remove'].indexOf(payload[0]) > -1) {
      text = `MESH: ${Array.from(payload).slice(0, 2).join(' ')}`
    }

    // if we get multiple paremeters pass them along (usually in the form `seneca.log.info('multiple', 'params'))
    else if (payload.length) {
      text = Array.from(payload).join(' ')
    }

    else if (payload.err) {

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

    // if no messages, log pattern/notice or '-'
    else {
      text = payload.pattern || payload.notice || '-'
    }

    if (payload.options) {
      kind = 'options'
      text = JSON.stringify(payload.options)
    }

    console.log(
      new Date(payload.when).toJSON(),
      context.id.padStart(50),
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
