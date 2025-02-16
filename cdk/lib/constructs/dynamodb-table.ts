import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import type { Environment } from '../types/environment';
import { getNamePrefixed } from '../utils/prefix';

export interface DynamoDBTableProps extends dynamodb.TableProps {
    tableName: string;
    environment: Environment;
}

export class DynamoDBTableConstruct extends Construct {
    table: dynamodb.Table;
    
    constructor(scope: Construct, id: string, props: DynamoDBTableProps) {
        super(scope, id);
        
        const tableProps = {
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            tableClass: dynamodb.TableClass.STANDARD_INFREQUENT_ACCESS,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            ...props,
        };
        // Overrides the table name with a prefixed version
        tableProps.tableName = getNamePrefixed(props.tableName, props.environment);
        this.table = new dynamodb.Table(this, `Table${id}`, tableProps);
    }
}