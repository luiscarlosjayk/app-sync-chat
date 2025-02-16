import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import { Environment } from '../../types/environment';
import { EventApi } from './nested/event-api';

export interface StatelessStackProps extends cdk.StackProps {
    environment: Environment;
}

export class StatelessStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: StatelessStackProps) {
        super(scope, id, props);

        const { environment } = props;

        new EventApi(this, 'EventApi', {
            environment,
        });
    }
}
