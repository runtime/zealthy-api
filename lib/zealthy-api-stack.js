"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZealthyApiStack = void 0;
const cdk = require("aws-cdk-lib");
const dynamodb = require("aws-cdk-lib/aws-dynamodb");
const api = require("aws-cdk-lib/aws-apigateway");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const aws_lambda_nodejs_1 = require("aws-cdk-lib/aws-lambda-nodejs");
const aws_lambda_1 = require("aws-cdk-lib/aws-lambda");
const path_1 = require("path");
// import * as sqs from 'aws-cdk-lib/aws-sqs';
class ZealthyApiStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // The code that defines your stack goes here
        // create a dynamo db table
        const zealthyUserTable = new dynamodb.Table(this, 'ZealthyUserTable', {
            partitionKey: {
                name: 'id',
                type: dynamodb.AttributeType.STRING
            },
            tableName: 'zealthy-users',
            removalPolicy: aws_cdk_lib_1.RemovalPolicy.DESTROY,
        });
        const nodejsFunctionProps = {
            bundling: {
                externalModules: [
                    'aws-sdk',
                ],
            },
            depsLockFilePath: (0, path_1.join)(__dirname, '../package-lock.json'),
            environment: {
                PRIMARY_KEY: 'itemId',
                TABLE_NAME: zealthyUserTable.tableName,
            },
            runtime: aws_lambda_1.Runtime.NODEJS_16_X,
        };
        const lambdaAPIFunction = new aws_lambda_nodejs_1.NodejsFunction(this, 'LambdaAPIFunction', {
            entry: (0, path_1.join)(__dirname, '../lambdas', 'lambdaHandler.js'),
            ...nodejsFunctionProps,
        });
        // give permissions to lambda function to dynamo table
        zealthyUserTable.grantReadWriteData(lambdaAPIFunction);
        // integrate lambda functions with the api gateway resource
        const lambdaFunctionIntegration = new api.LambdaIntegration(lambdaAPIFunction);
        const zealthyAPI = new api.RestApi(this, 'ZealthyAPI', {
            restApiName: 'zealthy-api',
            description: 'Zealthy API',
            defaultCorsPreflightOptions: {
                allowOrigins: api.Cors.ALL_ORIGINS,
                allowMethods: api.Cors.ALL_METHODS,
            },
        });
        // const rootMethod = zealthyAPI.root.addMethod(
        //   'ANY', lambdaFunctionIntegration, {
        //       requestParameters: {
        //         'method.request.path.proxy': true,
        //       },
        //     authorizationType: api.AuthorizationType.NONE,
        // });
        const users = zealthyAPI.root.addResource('users');
        users.addMethod('ANY', lambdaFunctionIntegration);
        // add cors options... lets see
        const proxy = users.addProxy({
            anyMethod: true,
            defaultMethodOptions: {
                requestParameters: {
                    'method.request.path.proxy': true,
                },
            },
        });
        // proxy.addCorsPreflight({
        //     allowHeaders: ['*'],
        //     allowOrigins: ['*'],
        //     allowMethods: ['*'],
        //     allowCredentials: false,
        // });
        new cdk.CfnOutput(this, 'API Gateway URL', {
            value: zealthyAPI.url ?? 'Something went wrong with the CDK Deploy'
        });
    }
}
exports.ZealthyApiStack = ZealthyApiStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiemVhbHRoeS1hcGktc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ6ZWFsdGh5LWFwaS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBbUM7QUFFbkMscURBQXFEO0FBQ3JELGtEQUFrRDtBQUNsRCw2Q0FBd0Q7QUFDeEQscUVBQW9GO0FBQ3BGLHVEQUFpRDtBQUdqRCwrQkFBMEI7QUFDMUIsOENBQThDO0FBRTlDLE1BQWEsZUFBZ0IsU0FBUSxHQUFHLENBQUMsS0FBSztJQUM1QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzlELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLDZDQUE2QztRQUU3QywyQkFBMkI7UUFDM0IsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLGtCQUFrQixFQUFFO1lBQ3BFLFlBQVksRUFBRTtnQkFDWixJQUFJLEVBQUUsSUFBSTtnQkFDVixJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNO2FBQ3BDO1lBQ0QsU0FBUyxFQUFFLGVBQWU7WUFDMUIsYUFBYSxFQUFFLDJCQUFhLENBQUMsT0FBTztTQUNyQyxDQUFDLENBQUM7UUFFSCxNQUFNLG1CQUFtQixHQUF3QjtZQUMvQyxRQUFRLEVBQUU7Z0JBQ1IsZUFBZSxFQUFFO29CQUNmLFNBQVM7aUJBQ1Y7YUFDRjtZQUNELGdCQUFnQixFQUFFLElBQUEsV0FBSSxFQUFDLFNBQVMsRUFBRSxzQkFBc0IsQ0FBQztZQUN6RCxXQUFXLEVBQUU7Z0JBQ1gsV0FBVyxFQUFFLFFBQVE7Z0JBQ3JCLFVBQVUsRUFBRSxnQkFBZ0IsQ0FBQyxTQUFTO2FBQ3ZDO1lBQ0QsT0FBTyxFQUFFLG9CQUFPLENBQUMsV0FBVztTQUM3QixDQUFBO1FBRUQsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLGtDQUFjLENBQUMsSUFBSSxFQUFFLG1CQUFtQixFQUFFO1lBQ3RFLEtBQUssRUFBRSxJQUFBLFdBQUksRUFBQyxTQUFTLEVBQUUsWUFBWSxFQUFFLGtCQUFrQixDQUFDO1lBQ3hELEdBQUcsbUJBQW1CO1NBQ3ZCLENBQUMsQ0FBQztRQUVILHNEQUFzRDtRQUV0RCxnQkFBZ0IsQ0FBQyxrQkFBa0IsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBRXZELDJEQUEyRDtRQUMzRCxNQUFNLHlCQUF5QixHQUFHLElBQUksR0FBRyxDQUFDLGlCQUFpQixDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFFL0UsTUFBTSxVQUFVLEdBQUcsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUU7WUFDckQsV0FBVyxFQUFFLGFBQWE7WUFDMUIsV0FBVyxFQUFFLGFBQWE7WUFDMUIsMkJBQTJCLEVBQUU7Z0JBQzNCLFlBQVksRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVc7Z0JBQ2xDLFlBQVksRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVc7YUFDbkM7U0FDRixDQUFDLENBQUM7UUFFSCxnREFBZ0Q7UUFDaEQsd0NBQXdDO1FBQ3hDLDZCQUE2QjtRQUM3Qiw2Q0FBNkM7UUFDN0MsV0FBVztRQUNYLHFEQUFxRDtRQUNyRCxNQUFNO1FBRU4sTUFBTSxLQUFLLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDbkQsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUseUJBQXlCLENBQUMsQ0FBQztRQUNsRCwrQkFBK0I7UUFFL0IsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQztZQUN6QixTQUFTLEVBQUUsSUFBSTtZQUNmLG9CQUFvQixFQUFFO2dCQUNwQixpQkFBaUIsRUFBRTtvQkFDakIsMkJBQTJCLEVBQUUsSUFBSTtpQkFDbEM7YUFDRjtTQUNKLENBQUMsQ0FBQTtRQUVGLDJCQUEyQjtRQUMzQiwyQkFBMkI7UUFDM0IsMkJBQTJCO1FBQzNCLDJCQUEyQjtRQUMzQiwrQkFBK0I7UUFDL0IsTUFBTTtRQUVOLElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLEVBQUU7WUFDekMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxHQUFHLElBQUksMENBQTBDO1NBQ3BFLENBQUMsQ0FBQztJQUdMLENBQUM7Q0FDRjtBQXJGRCwwQ0FxRkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgKiBhcyBkeW5hbW9kYiBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWR5bmFtb2RiXCI7XG5pbXBvcnQgKiBhcyBhcGkgZnJvbSAnYXdzLWNkay1saWIvYXdzLWFwaWdhdGV3YXknO1xuaW1wb3J0IHsgQXBwLCBTdGFjaywgUmVtb3ZhbFBvbGljeSB9IGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IE5vZGVqc0Z1bmN0aW9uLCBOb2RlanNGdW5jdGlvblByb3BzIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYS1ub2RlanMnO1xuaW1wb3J0IHsgUnVudGltZSB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xuXG5cbmltcG9ydCB7am9pbn0gZnJvbSBcInBhdGhcIjtcbi8vIGltcG9ydCAqIGFzIHNxcyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc3FzJztcblxuZXhwb3J0IGNsYXNzIFplYWx0aHlBcGlTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIC8vIFRoZSBjb2RlIHRoYXQgZGVmaW5lcyB5b3VyIHN0YWNrIGdvZXMgaGVyZVxuXG4gICAgLy8gY3JlYXRlIGEgZHluYW1vIGRiIHRhYmxlXG4gICAgY29uc3QgemVhbHRoeVVzZXJUYWJsZSA9IG5ldyBkeW5hbW9kYi5UYWJsZSh0aGlzLCAnWmVhbHRoeVVzZXJUYWJsZScsIHtcbiAgICAgIHBhcnRpdGlvbktleToge1xuICAgICAgICBuYW1lOiAnaWQnLFxuICAgICAgICB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklOR1xuICAgICAgfSxcbiAgICAgIHRhYmxlTmFtZTogJ3plYWx0aHktdXNlcnMnLFxuICAgICAgcmVtb3ZhbFBvbGljeTogUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxuICAgIH0pO1xuXG4gICAgY29uc3Qgbm9kZWpzRnVuY3Rpb25Qcm9wczogTm9kZWpzRnVuY3Rpb25Qcm9wcyA9IHtcbiAgICAgIGJ1bmRsaW5nOiB7XG4gICAgICAgIGV4dGVybmFsTW9kdWxlczogW1xuICAgICAgICAgICdhd3Mtc2RrJyxcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgICBkZXBzTG9ja0ZpbGVQYXRoOiBqb2luKF9fZGlybmFtZSwgJy4uL3BhY2thZ2UtbG9jay5qc29uJyksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBQUklNQVJZX0tFWTogJ2l0ZW1JZCcsXG4gICAgICAgIFRBQkxFX05BTUU6IHplYWx0aHlVc2VyVGFibGUudGFibGVOYW1lLFxuICAgICAgfSxcbiAgICAgIHJ1bnRpbWU6IFJ1bnRpbWUuTk9ERUpTXzE2X1gsXG4gICAgfVxuXG4gICAgY29uc3QgbGFtYmRhQVBJRnVuY3Rpb24gPSBuZXcgTm9kZWpzRnVuY3Rpb24odGhpcywgJ0xhbWJkYUFQSUZ1bmN0aW9uJywge1xuICAgICAgZW50cnk6IGpvaW4oX19kaXJuYW1lLCAnLi4vbGFtYmRhcycsICdsYW1iZGFIYW5kbGVyLmpzJyksXG4gICAgICAuLi5ub2RlanNGdW5jdGlvblByb3BzLFxuICAgIH0pO1xuXG4gICAgLy8gZ2l2ZSBwZXJtaXNzaW9ucyB0byBsYW1iZGEgZnVuY3Rpb24gdG8gZHluYW1vIHRhYmxlXG5cbiAgICB6ZWFsdGh5VXNlclRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShsYW1iZGFBUElGdW5jdGlvbik7XG5cbiAgICAvLyBpbnRlZ3JhdGUgbGFtYmRhIGZ1bmN0aW9ucyB3aXRoIHRoZSBhcGkgZ2F0ZXdheSByZXNvdXJjZVxuICAgIGNvbnN0IGxhbWJkYUZ1bmN0aW9uSW50ZWdyYXRpb24gPSBuZXcgYXBpLkxhbWJkYUludGVncmF0aW9uKGxhbWJkYUFQSUZ1bmN0aW9uKTtcblxuICAgIGNvbnN0IHplYWx0aHlBUEkgPSBuZXcgYXBpLlJlc3RBcGkodGhpcywgJ1plYWx0aHlBUEknLCB7XG4gICAgICByZXN0QXBpTmFtZTogJ3plYWx0aHktYXBpJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnWmVhbHRoeSBBUEknLFxuICAgICAgZGVmYXVsdENvcnNQcmVmbGlnaHRPcHRpb25zOiB7XG4gICAgICAgIGFsbG93T3JpZ2luczogYXBpLkNvcnMuQUxMX09SSUdJTlMsXG4gICAgICAgIGFsbG93TWV0aG9kczogYXBpLkNvcnMuQUxMX01FVEhPRFMsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gY29uc3Qgcm9vdE1ldGhvZCA9IHplYWx0aHlBUEkucm9vdC5hZGRNZXRob2QoXG4gICAgLy8gICAnQU5ZJywgbGFtYmRhRnVuY3Rpb25JbnRlZ3JhdGlvbiwge1xuICAgIC8vICAgICAgIHJlcXVlc3RQYXJhbWV0ZXJzOiB7XG4gICAgLy8gICAgICAgICAnbWV0aG9kLnJlcXVlc3QucGF0aC5wcm94eSc6IHRydWUsXG4gICAgLy8gICAgICAgfSxcbiAgICAvLyAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaS5BdXRob3JpemF0aW9uVHlwZS5OT05FLFxuICAgIC8vIH0pO1xuXG4gICAgY29uc3QgdXNlcnMgPSB6ZWFsdGh5QVBJLnJvb3QuYWRkUmVzb3VyY2UoJ3VzZXJzJyk7XG4gICAgdXNlcnMuYWRkTWV0aG9kKCdBTlknLCBsYW1iZGFGdW5jdGlvbkludGVncmF0aW9uKTtcbiAgICAvLyBhZGQgY29ycyBvcHRpb25zLi4uIGxldHMgc2VlXG5cbiAgICBjb25zdCBwcm94eSA9IHVzZXJzLmFkZFByb3h5KHtcbiAgICAgICAgYW55TWV0aG9kOiB0cnVlLFxuICAgICAgICBkZWZhdWx0TWV0aG9kT3B0aW9uczoge1xuICAgICAgICAgIHJlcXVlc3RQYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgICAnbWV0aG9kLnJlcXVlc3QucGF0aC5wcm94eSc6IHRydWUsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICB9KVxuXG4gICAgLy8gcHJveHkuYWRkQ29yc1ByZWZsaWdodCh7XG4gICAgLy8gICAgIGFsbG93SGVhZGVyczogWycqJ10sXG4gICAgLy8gICAgIGFsbG93T3JpZ2luczogWycqJ10sXG4gICAgLy8gICAgIGFsbG93TWV0aG9kczogWycqJ10sXG4gICAgLy8gICAgIGFsbG93Q3JlZGVudGlhbHM6IGZhbHNlLFxuICAgIC8vIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0FQSSBHYXRld2F5IFVSTCcsIHtcbiAgICAgIHZhbHVlOiB6ZWFsdGh5QVBJLnVybCA/PyAnU29tZXRoaW5nIHdlbnQgd3Jvbmcgd2l0aCB0aGUgQ0RLIERlcGxveSdcbiAgICB9KTtcblxuXG4gIH1cbn1cbiJdfQ==