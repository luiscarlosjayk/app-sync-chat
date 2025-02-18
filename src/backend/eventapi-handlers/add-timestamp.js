import { util } from '@aws-appsync/utils'
/**
 * Runs when a batch of events is published to channels in this namespace.
 * @param {*} ctx the context
 * @returns {*} An array of events to broadcast to subscribers
 */
export function onPublish(ctx) {
  return ctx.events.map(event => ({
    id: event.id,
    payload: {
      ...event.payload,
      timestamp: util.time.nowFormatted("MM-dd HH:mm", "-06:00"), // Mexico City timezone
    }
  }))
}

/**
 * Runs when a client subscribes to a channel in this namespace.
 * @param {*} ctx the context
 */
export function onSubscribe(ctx) {
  // Reject a subscription attempt
  // util.unauthorized();
}