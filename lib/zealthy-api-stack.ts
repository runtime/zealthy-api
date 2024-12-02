import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { IResource, LambdaIntegration, MockIntegration, PassthroughBehavior, RestApi } from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as api from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { join } from "path";

export class ZealthyApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Table
    const zealthyUserTable = new dynamodb.Table(this, 'ZealthyUserTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      tableName: 'zealthy-users',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Lambda Function
    const nodejsFunctionProps: NodejsFunctionProps = {
      bundling: {
        externalModules: ['aws-sdk'],
      },
      depsLockFilePath: join(__dirname, '../package-lock.json'),
      environment: {
        PRIMARY_KEY: 'id',
        TABLE_NAME: zealthyUserTable.tableName,
      },
      runtime: Runtime.NODEJS_16_X,
    };

    const lambdaAPIFunction = new NodejsFunction(this, 'LambdaAPIFunction', {
      entry: join(__dirname, '../lambdas', 'lambdaHandler.js'),
      bundling: {
        externalModules: ['aws-sdk'],
      },
      depsLockFilePath: join(__dirname, '../package-lock.json'),
      environment: {
        PRIMARY_KEY: 'id',
        TABLE_NAME: zealthyUserTable.tableName,
      },
      runtime: Runtime.NODEJS_16_X,
    });

    // Grant permissions to Lambda
    zealthyUserTable.grantReadWriteData(lambdaAPIFunction);

    // API Gateway
    const zealthyAPI = new api.RestApi(this, 'ZealthyAPI', {
      restApiName: 'zealthy-api',
      description: 'Zealthy API',
      // defaultCorsPreflightOptions: {
      //   allowOrigins: api.Cors.ALL_ORIGINS,
      //   allowMethods: api.Cors.ALL_METHODS,
      // },
    });

    addCorsOptions(zealthyAPI.root, ['http://localhost:3000'])

    // Add "/users" resource
    const users = zealthyAPI.root.addResource('users');
    users.addMethod('POST', new api.LambdaIntegration(lambdaAPIFunction)); // Create user
    users.addMethod('GET', new api.LambdaIntegration(lambdaAPIFunction)); // get users
    addCorsOptions(users, ['http://localhost:3000'])



    // Add "/users/{id}" resource
    const userById = users.addResource('{id}');
    userById.addMethod('GET', new api.LambdaIntegration(lambdaAPIFunction)); // Fetch specific user
    userById.addMethod('PUT', new api.LambdaIntegration(lambdaAPIFunction)); // Update user
    addCorsOptions(userById, ['http://localhost:3000'])

    new cdk.CfnOutput(this, 'API Gateway URL', {
      value: zealthyAPI.url ?? 'Something went wrong with the CDK Deploy',
    });
  }
}

// CORS configuration function
export function addCorsOptions(apiResource: IResource, allowedOrigins: string[]) {
  const origin = allowedOrigins.join(', '); // Join allowed origins into a string

  apiResource.addMethod('OPTIONS', new MockIntegration({
    integrationResponses: [{
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
        'method.response.header.Access-Control-Allow-Methods': "'GET,POST,PUT,OPTIONS'",
        'method.response.header.Access-Control-Allow-Origin': `'${origin}'`,  // Properly wrap in quotes
        'method.response.header.Access-Control-Max-Age': "'600'", // Disable CORS caching for testing
      },
    }],
    passthroughBehavior: PassthroughBehavior.WHEN_NO_MATCH,
    requestTemplates: {
      "application/json": "{\"statusCode\": 200}"
    },
  }), {
    methodResponses: [{
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Headers': true,
        'method.response.header.Access-Control-Allow-Methods': true,
        'method.response.header.Access-Control-Allow-Origin': true,
        'method.response.header.Access-Control-Max-Age': true,
      },
    }],
  });
}
