import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as rustLambda from 'cargo-lambda-cdk';
import { Construct } from 'constructs';
import * as nodePath from 'node:path';
import { LambdaFunctionBuilder } from './lambda-function-builder.base';
import type { Environment } from '../../types/environment';
import { BACKEND_BASEPATH } from '../../utils/constants';

export interface RustLambdaFunctionProps {
    name: string;
    environment: Environment;
}

export class RustLambdaFunctionBuilder extends LambdaFunctionBuilder {
    protected _lambda: rustLambda.RustFunction;
    protected _manifestPath: string;
    protected _bundling?: rustLambda.BundlingOptions;

    constructor(scope: Construct, id: string, props: RustLambdaFunctionProps) {
        super(scope, id, props.name, props.environment);

        // Defaults
        this.withManifest(this._name);
    }

    withManifest(path: string, basePath?: string): this {
        basePath = basePath ?? BACKEND_BASEPATH;
        this._manifestPath = nodePath.join(basePath, `${path}/Cargo.toml`);
        return this;
    }

    withBundling(bundling: rustLambda.BundlingOptions): this {
        this._bundling = bundling;
        return this;
    }

    build(): cdk.aws_lambda.IFunction {
        if (!this._manifestPath) {
            throw 'Expected manifestPath to be defined.';
        }

        this._lambda = new rustLambda.RustFunction(this, 'RustFunction', {
            functionName: this._lambdaName,
            manifestPath: this._manifestPath,
            timeout: this._duration,
            memorySize: this._memorySize,
            logGroup: this._logGroup,
            environment: this._environmentVariables,
            reservedConcurrentExecutions: this._concurrency,
            architecture: lambda.Architecture.ARM_64,
            role: this._role,
            vpc: this._vpc,
            vpcSubnets: this._vpcSubnets,
            securityGroups: this._securityGroups,
            layers: this._layers,
            bundling: this._bundling,
        });

        return this._lambda;
    }
}