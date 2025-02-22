import * as cdk from 'aws-cdk-lib';
import { NestedStack } from 'aws-cdk-lib';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as events from 'aws-cdk-lib/aws-events';
import { Construct } from 'constructs';
import * as nodePath from 'node:path';
import { NodejsLambdaFunctionBuilder } from '../../../constructs/lambda/nodejs-lambda-function-builder';
import { Environment } from '../../../types/environment';
import { BACKEND_BASEPATH } from '../../../utils/constants';
import { getNamePrefixed } from '../../../utils/prefix';
import * as certificates from 'aws-cdk-lib/aws-certificatemanager';

export interface EventApiStackProps extends cdk.NestedStackProps {
    environment: Environment;
}

export class EventApi extends NestedStack {
    constructor(scope: Construct, id: string, props: EventApiStackProps) {
        super(scope, id, props);

        const { environment } = props;

        const lambdaAuthorizerFunction = new NodejsLambdaFunctionBuilder(this, 'LambdaAuthorizerFunction', {
            name: 'lambda-authorizer',
            environment,
        })
        .withEntry('lambda-authorizer')
        .withLogGroup()
        .withDuration(10) // EventAPI Lambda authorizers have a max timeout of 10 seconds
        .withEnvironmentVariables({
            AUTHORIZATION_TOKEN: 'abcd',
        })
        .build();

        // Add resource policy to allow AppSync to invoke the Lambda
        lambdaAuthorizerFunction.addPermission('AppSyncInvoke', {
            principal: new iam.ServicePrincipal('appsync.amazonaws.com'),
            action: 'lambda:InvokeFunction',
        });
        
        const apiKeyProvider: appsync.AppSyncAuthProvider = {
            authorizationType: appsync.AppSyncAuthorizationType.API_KEY,
        };

        const lambdaAuthorizer: appsync.AppSyncAuthProvider = {
            authorizationType: appsync.AppSyncAuthorizationType.LAMBDA,
            lambdaAuthorizerConfig: {
                handler: lambdaAuthorizerFunction,
                resultsCacheTtl: cdk.Duration.seconds(0),
            },
        };

        const api = new appsync.EventApi(this, `EventApi${id}`, {
            apiName: getNamePrefixed('event-api', environment),
            authorizationConfig: {
                authProviders: [
                    apiKeyProvider,
                    lambdaAuthorizer,
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

        const namespaceHandler = appsync.Code.fromAsset(nodePath.join(BACKEND_BASEPATH, 'eventapi-handlers', 'add-timestamp.js'));

        api.addChannelNamespace(`PublicChannel${id}`, {
            channelNamespaceName: 'public-chat',
            code: namespaceHandler,
        });

        api.addChannelNamespace(`PrivateChannel${id}`, {
            channelNamespaceName: 'private-chat',
            code: namespaceHandler,
            authorizationConfig: {
                publishAuthModeTypes: [ appsync.AppSyncAuthorizationType.LAMBDA ],
                subscribeAuthModeTypes: [ appsync.AppSyncAuthorizationType.LAMBDA ],
            },
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