import { NestedStack } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { Environment } from '../../../types/environment';
import { getNamePrefixed } from '../../../utils/prefix';

export interface EventApiStackProps extends cdk.NestedStackProps {
    environment: Environment;
}

export class EventApi extends NestedStack {
    constructor(scope: Construct, id: string, props: EventApiStackProps) {
        super(scope, id, props);

        const { environment } = props;
        
        const apiKeyProvider: appsync.AppSyncAuthProvider = {
            authorizationType: appsync.AppSyncAuthorizationType.API_KEY,
        };

        const api = new appsync.EventApi(this, `EventApi${id}`, {
            apiName: getNamePrefixed('event-api', environment),
            authorizationConfig: {
                authProviders: [
                    apiKeyProvider,
                ],
                connectionAuthModeTypes: [
                    appsync.AppSyncAuthorizationType.API_KEY,
                ],
                defaultPublishAuthModeTypes: [
                    appsync.AppSyncAuthorizationType.API_KEY,
                ],
                defaultSubscribeAuthModeTypes: [
                    appsync.AppSyncAuthorizationType.API_KEY,
                ],
            },
            logConfig: {
                fieldLogLevel: appsync.AppSyncFieldLogLevel.INFO,
                retention: logs.RetentionDays.ONE_DAY,
            },
        });

        api.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

        api.addChannelNamespace(`PublicChannel${id}`, {
            channelNamespaceName: 'public-chat',
        });

        api.addChannelNamespace(`PrivateChannel${id}`, {
            channelNamespaceName: 'private-chat',
        });

        /**
         * Outputs
         */
        new cdk.CfnOutput(this, 'OutputEventApiId', {
            value: api.apiId,
            exportName: getNamePrefixed('event-api-id', environment),
        });

        new cdk.CfnOutput(this, 'OutputEventApiLogGroupName', {
            value: `/aws/appsync/apis/${api.apiId}`,
            exportName: getNamePrefixed('event-api-log-group-name', environment),
        });
    }
}