import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { STATUS_CODES } from 'node:http';
import * as nodePath from 'node:path';

export const SRC_BASEPATH = '../../../src';
export const BACKEND_BASEPATH = nodePath.join(__dirname, `${SRC_BASEPATH}/backend`);
export const CLIENT_BASEPATH = nodePath.join(__dirname, `${SRC_BASEPATH}/client`);
export const HTTP = {
    METHOD: {
        GET: 'GET',
        POST: 'POST',
        PUT: 'PUT',
        PATCH: 'PATCH',
        DELETE: 'DELETE',
        HEAD: 'HEAD',
        OPTIONS: 'OPTIONS',
        CONNECT: 'CONNECT',
        TRACE: 'TRACE',
    },
    STATUS_CODE: Object.entries(STATUS_CODES).map(([code, message]) => ({ code: parseInt(code), message })),
} as const;

export const NODEJS_RUNTIME = {
    NODEJS_LATEST: Runtime.NODEJS_LATEST,
    NODEJS_22_X: Runtime.NODEJS_22_X,
    NODEJS_20_X: Runtime.NODEJS_20_X,
    NODEJS_18_X: Runtime.NODEJS_18_X,
};