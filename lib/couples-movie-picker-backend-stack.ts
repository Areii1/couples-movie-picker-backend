import * as cdk from "@aws-cdk/core";
import * as dynamodb from "@aws-cdk/aws-dynamodb";
import * as lambda from "@aws-cdk/aws-lambda";
import * as apigw from "@aws-cdk/aws-apigateway";
import cognito = require("@aws-cdk/aws-cognito");

export class CouplesMoviePickerBackendStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const autoConfirmUser = new lambda.Function(this, "AutoConfirmUser", {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: new lambda.AssetCode("src"),
      handler: "autoConfirm.handler",
    });

    const userPool = new cognito.UserPool(
      this,
      "couples-movie-picker-user-pool",
      {
        userPoolName: "couples-movie-picker-user-pool",
        selfSignUpEnabled: true,
        autoVerify: { email: true },
        passwordPolicy: {
          minLength: 6,
          requireLowercase: false,
          requireUppercase: false,
          requireDigits: false,
          requireSymbols: false,
        },
        lambdaTriggers: {
          preSignUp: autoConfirmUser,
        },
      }
    );

    new cognito.UserPoolClient(this, "couples-movie-picker-user-pool-client", {
      userPool,
      generateSecret: false,
    });

    new cognito.CfnIdentityPool(this, "couples-movie-picker-identity-pool", {
      allowUnauthenticatedIdentities: false,
      identityPoolName: "couples-movie-picker-identity-pool",
    });

    const usersTable = new dynamodb.Table(this, "users", {
      partitionKey: { name: "username", type: dynamodb.AttributeType.STRING },
    });

    const movies = new dynamodb.Table(this, "movies", {
      partitionKey: { name: "title", type: dynamodb.AttributeType.STRING },
    });

    const addUser = new lambda.Function(this, "AddUserHandler", {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: new lambda.AssetCode("src"),
      handler: "addUser.handler",
      environment: {
        USERS_TABLE_NAME: usersTable.tableName,
      },
    });

    const likeMovie = new lambda.Function(this, "LikeMovieHandler", {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: new lambda.AssetCode("src"),
      handler: "likeMovie.handler",
      environment: {
        USERS_TABLE_NAME: usersTable.tableName,
      },
    });

    const getUsers = new lambda.Function(this, "GetUsersHandler", {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: new lambda.AssetCode("src"),
      handler: "getUsers.handler",
      environment: {
        USERS_TABLE_NAME: usersTable.tableName,
      },
    });

    const api = new apigw.RestApi(this, "couples-movie-picker-api", {
      restApiName: "couples-movie-picker-api",
    });

    const userResource = api.root.addResource("user");
    addCorsOptions(userResource);

    const getUsersIntegration = new apigw.LambdaIntegration(getUsers);
    userResource.addMethod("GET", getUsersIntegration);
    usersTable.grantReadWriteData(getUsers as any);

    const addUserIntegration = new apigw.LambdaIntegration(addUser);
    userResource.addMethod("POST", addUserIntegration);
    usersTable.grantReadWriteData(addUser as any);

    const moviesResource = api.root.addResource("movies");
    addCorsOptions(moviesResource);

    const likeMovieIntegration = new apigw.LambdaIntegration(likeMovie);
    moviesResource.addMethod("POST", likeMovieIntegration);
    usersTable.grantReadWriteData(likeMovie as any);
  }
}

export function addCorsOptions(apiResource: apigw.IResource) {
  apiResource.addMethod(
    "OPTIONS",
    new apigw.MockIntegration({
      integrationResponses: [
        {
          statusCode: "200",
          responseParameters: {
            "method.response.header.Access-Control-Allow-Headers":
              "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
            "method.response.header.Access-Control-Allow-Origin": "'*'",
            "method.response.header.Access-Control-Allow-Credentials":
              "'false'",
            "method.response.header.Access-Control-Allow-Methods":
              "'OPTIONS,GET,PUT,POST,DELETE'",
          },
        },
      ],
      passthroughBehavior: apigw.PassthroughBehavior.NEVER,
      requestTemplates: {
        "application/json": '{"statusCode": 200}',
      },
    }),
    {
      methodResponses: [
        {
          statusCode: "200",
          responseParameters: {
            "method.response.header.Access-Control-Allow-Headers": true,
            "method.response.header.Access-Control-Allow-Methods": true,
            "method.response.header.Access-Control-Allow-Credentials": true,
            "method.response.header.Access-Control-Allow-Origin": true,
          },
        },
      ],
    }
  );
}
