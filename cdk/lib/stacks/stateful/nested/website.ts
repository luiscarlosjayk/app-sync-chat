import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as certificates from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as s3Deployment from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfrontOrigins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';
import { Environment } from '../../../types/environment';
import { getNamePrefixed } from '../../../utils/prefix';
import { BACKEND_BASEPATH, CLIENT_BASEPATH } from '../../../utils/constants';

export interface WebsiteStackProps extends cdk.NestedStackProps {
    environment: Environment;
    customDomain?: {
        subdomain: string;
        rootdomain: string;
    };
}

export class WebsiteStack extends cdk.NestedStack {
    constructor(scope: Construct, id :string, props: WebsiteStackProps) {
        super(scope, id, props);

        const { environment, customDomain } = props;
        
        /**
         * S3 Bucket
        */
        const bucket = new s3.Bucket(this, `WebsiteBucket${id}`, {
            bucketName: getNamePrefixed('website-bucket', environment),
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
            accessControl: s3.BucketAccessControl.PRIVATE,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            publicReadAccess: false,
            objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
            enforceSSL: true,
        });
        
        const fullDomainName = customDomain ? `${customDomain.subdomain}.${customDomain.rootdomain}` : null;
        
        /**
         * Route 53
         */
        const hostedZone = customDomain?.rootdomain ? route53.HostedZone.fromLookup(this, `HostedZone${id}`, {
            domainName: customDomain.rootdomain,
        }) : undefined;

        /**
         * SSL Certificate
         */
        const certificate = fullDomainName && hostedZone ? new certificates.Certificate(this, `ACMCertificate${id}`, {
            domainName: fullDomainName,
            validation: certificates.CertificateValidation.fromDns(hostedZone),
        }) : undefined;

        /**
         * CloudFront
         */
        const cloudFrontFunction = new cloudfront.Function(this, `CloudFrontFunction${id}`, {
            code: cloudfront.FunctionCode.fromFile({
                filePath: `${BACKEND_BASEPATH}/cloudfront-router/index.js`,
            }),
            runtime: cloudfront.FunctionRuntime.JS_2_0,
            comment: 'CloudFront function to support SPA routing',
            autoPublish: true,
        });

        const cloudFrontDistribution = new cloudfront.Distribution(this, `Distribution$${id}`, {
            defaultRootObject: 'index.html',
            priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // We're not rich 💰 yet
            certificate: certificate,
            domainNames: fullDomainName ? [ fullDomainName ] : undefined,
            defaultBehavior: {
                    origin: cloudfrontOrigins.S3BucketOrigin.withOriginAccessControl(bucket),
                    allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
                    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    compress: true,
                    originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
                    functionAssociations: [
                        {
                            function: cloudFrontFunction,
                            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
                        },
                    ],
            },
            errorResponses: [
                {
                    httpStatus: 403,
                    responseHttpStatus: 200,
                    responsePagePath: '/index.html',
                },
                {
                    httpStatus: 404,
                    responseHttpStatus: 200,
                    responsePagePath: '/index.html',
                },
            ],
        });

        // This deploys the content of the /dist folder in the bucket and triggers an invalidation for all routes
        const distPath = `${CLIENT_BASEPATH}/dist`;
        new s3Deployment.BucketDeployment(this, 'WebsiteBucketDeployment', {
            destinationBucket: bucket,
            sources: [s3Deployment.Source.asset(distPath)],
            prune: true,
            distributionPaths: cloudFrontDistribution ? ['/*'] : undefined, // Invalidate cache
            distribution: cloudFrontDistribution,
        });

        // Link the subdomain to the distribution within the hosted zone
        hostedZone && customDomain?.subdomain && new route53.ARecord(this, `Route53ARecord${id}`, {
            recordName: customDomain.subdomain,
            zone: hostedZone,
            target: route53.RecordTarget.fromAlias(
                new route53Targets.CloudFrontTarget(
                    cloudFrontDistribution
                )
            ),
        });

        /**
         * Outputs
         */

        new cdk.CfnOutput(this, 'OutputWebsiteBucketName', {
            exportName: getNamePrefixed('website-bucket-name', environment),
            value: bucket.bucketName,
        });

        new cdk.CfnOutput(this, 'OutputWebsiteBucketArn', {
            exportName: getNamePrefixed('website-bucket-arn', environment),
            value: bucket.bucketArn,
        });

        cloudFrontDistribution && new cdk.CfnOutput(this, 'OutputWebsiteDistributionId', {
            exportName: getNamePrefixed('website-distribution-domain-name', environment),
            value: cloudFrontDistribution.distributionDomainName,
        });
    }
}