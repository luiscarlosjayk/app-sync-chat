/**
 * EventAPI Lambda authorizer
 * 
 * @see https://docs.aws.amazon.com/appsync/latest/eventapi/configure-event-api-auth.html#aws-lambda-authorization
 */

import { AppSyncAuthorizerEvent, AppSyncAuthorizerResult, Context } from 'aws-lambda';

export interface Response {
    // A boolean value indicating if the value in authorizationToken is authorized to execute the operation on the Event API
    isAuthorized: boolean;
    // A JSON object visible as $ctx.identity.handlerContext in your handlers
    handlerContext?: {
        [key: string]: string;
    };
    // The number of seconds that the response should be cached for
    ttlOverride?: number;
}

const AUTHORIZATION_TOKEN = process.env.AUTHORIZATION_TOKEN;

export async function handler(event: AppSyncAuthorizerEvent, _context: Context): Promise<AppSyncAuthorizerResult<{}>> {
    console.log(event);
    const token = event.authorizationToken;

    const response: AppSyncAuthorizerResult<{}> = {
       isAuthorized: token === AUTHORIZATION_TOKEN,
       ttlOverride: 0,
       resolverContext: {},
    };

    console.log(response);

    return response;
}
