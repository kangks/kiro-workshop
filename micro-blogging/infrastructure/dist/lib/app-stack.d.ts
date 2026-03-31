import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
export declare class AppStack extends cdk.Stack {
    readonly userPool: cognito.UserPool;
    readonly userPoolClient: cognito.UserPoolClient;
    readonly identityPool: cognito.CfnIdentityPool;
    readonly usersTable: dynamodb.Table;
    readonly postsTable: dynamodb.Table;
    readonly likesTable: dynamodb.Table;
    readonly commentsTable: dynamodb.Table;
    readonly followsTable: dynamodb.Table;
    readonly api: apigateway.RestApi;
    readonly websiteBucket: s3.Bucket;
    readonly distribution: cloudfront.Distribution;
    constructor(scope: Construct, id: string, props?: cdk.StackProps);
}
