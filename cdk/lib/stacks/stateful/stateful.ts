import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Environment } from '../../types/environment';
import { WebsiteStack } from './nested/website';
export interface StatefulStackProps extends cdk.StackProps {
    environment: Environment;
    customDomain?: {
        subdomain: string;
        rootdomain: string;
    };
}

export class StatefulStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: StatefulStackProps) {
        super(scope, id, props);

        const { environment, customDomain } = props;

        new WebsiteStack(this, 'WebsiteStack', {
            environment,
            customDomain,
        });

    }
}
