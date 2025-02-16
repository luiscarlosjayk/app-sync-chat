#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import 'source-map-support/register';
import { getEnvironment } from '../lib/config/environments';
import { StatefulStack } from '../lib/stacks/stateful/stateful';
import { StatelessStack } from '../lib/stacks/stateless/stateless';
import { getNamePrefixed } from '../lib/utils/prefix';
import { loadEnvFile } from '../lib/utils/load-env';

// Load .env file
loadEnvFile();

const AWS_ACCOUNT = process.env.AWS_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT;
const AWS_REGION = process.env.AWS_REGION || process.env.CDK_DEFAULT_REGION;
const PROJECT_OWNER = process.env.PROJECT_OWNER ? { OWNER: process.env.PROJECT_OWNER } : null;
const CUSTOM_DOMAIN = process.env.DOMAIN;
const CUSTOM_SUBDOMAIN = process.env.SUBDOMAIN;

const environment = getEnvironment();
const app = new cdk.App();
const customDomain = (CUSTOM_DOMAIN?.length && CUSTOM_SUBDOMAIN?.length) ? {
    subdomain: CUSTOM_SUBDOMAIN,
    rootdomain: CUSTOM_DOMAIN,
} : undefined;

const statefulStackName = getNamePrefixed('stateful', environment);
const statefulStack = new StatefulStack(app, 'StatefulStack', {
    stackName: statefulStackName,
    environment,
    customDomain,
    env: {
        account: AWS_ACCOUNT,
        region: AWS_REGION,
    },
    // Set tags for all resources in the stack
    tags: {
        ...PROJECT_OWNER,
        STACK: statefulStackName,
        APP: environment.appName,
    },
});

const statelessStackName = getNamePrefixed('stateless', environment);
const statelessStack = new StatelessStack(app, 'StatelessStack', {
    stackName: statelessStackName,
    environment,
    env: {
        account: AWS_ACCOUNT,
        region: AWS_REGION,
    },
    // Set tags for all resources in the stack
    tags: {
        ...PROJECT_OWNER,
        STACK: statelessStackName,
        APP: environment.appName,
    },
});

statelessStack.addDependency(statefulStack);

app.synth();
