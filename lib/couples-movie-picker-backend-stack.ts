import * as cdk from "@aws-cdk/core";
import * as dynamodb from "@aws-cdk/aws-dynamodb";
import * as lambda from "@aws-cdk/aws-lambda";
import * as apigw from "@aws-cdk/aws-apigateway";
import cognito = require("@aws-cdk/aws-cognito");
import s3 = require("@aws-cdk/aws-s3");

export class CouplesMoviePickerBackendStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const usersTable = new dynamodb.Table(this, "users", {
      partitionKey: { name: "username", type: dynamodb.AttributeType.STRING },
    });

    const autoConfirmUser = new lambda.Function(this, "AutoConfirmUser", {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: new lambda.AssetCode("src"),
      handler: "autoConfirm.handler",
    });

    const addUser = new lambda.Function(this, "AddUserHandler", {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: new lambda.AssetCode("src"),
      handler: "addUser.handler",
      environment: {
        USERS_TABLE_NAME: usersTable.tableName,
      },
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
          postConfirmation: addUser,
        },
      }
    );

    new cognito.UserPoolClient(this, "couples-movie-picker-user-pool-client", {
      userPool,
      generateSecret: false,
    });

    // need to connect identitypool to user pool and app client
    // need to add roles for unauth and auth

    const identityPool = new cognito.CfnIdentityPool(
      this,
      "couples-movie-picker-identity-pool",
      {
        allowUnauthenticatedIdentities: true,
        // cognitoIdentityProviders: [
        //   { clientId: "3kc1hghrf2lkvrfehrjog7st1d" },
        //   { providerName: "eu-central-1_f7dMA4Naz" },
        // ],
      }
    );

    // const identityPoolUnauthenticatedRole = new CfnIdentityPoolRoleAttachment(this, 'couples-movie-picker-identity-pool-unauthenticated-role', {
    //   identityPoolId: identityPool.id,
    //   roles:
    // });

    const movies = new dynamodb.Table(this, "movies", {
      partitionKey: { name: "title", type: dynamodb.AttributeType.STRING },
    });

    const profilePictureUploadedTrigger = new lambda.Function(
      this,
      "ProfilePictureUploadedTrigger",
      {
        runtime: lambda.Runtime.NODEJS_10_X,
        code: new lambda.AssetCode("src"),
        handler: "profilePictureUploadedTrigger.handler",
        environment: {
          USERS_TABLE_NAME: usersTable.tableName,
        },
      }
    );
    usersTable.grantReadWriteData(profilePictureUploadedTrigger as any);

    const api = new apigw.RestApi(this, "couples-movie-picker-api", {
      restApiName: "couples-movie-picker-api",
    });

    const authorizer = new apigw.CfnAuthorizer(
      this,
      "couples-movie-picker-api-authorizer",
      {
        name: "couples-movie-picker-api-authorizer",
        restApiId: api.restApiId,
        type: apigw.AuthorizationType.COGNITO,
        identitySource: "method.request.header.Authorization",
        providerArns: [userPool.userPoolArn],
      }
    );

    const userResource = api.root.addResource("user");
    addCorsOptions(userResource);

    const getUsers = new lambda.Function(this, "GetUsersHandler", {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: new lambda.AssetCode("src"),
      handler: "getUsers.handler",
      environment: {
        USERS_TABLE_NAME: usersTable.tableName,
      },
    });

    const getUsersIntegration = new apigw.LambdaIntegration(getUsers);
    userResource.addMethod("GET", getUsersIntegration, {
      authorizationType: apigw.AuthorizationType.COGNITO,
      authorizer: { authorizerId: authorizer.ref },
    });
    usersTable.grantReadWriteData(getUsers as any);

    const pictureResource = userResource.addResource("picture");
    addCorsOptions(pictureResource);

    const removeProfilePicture = new lambda.Function(
      this,
      "RemoveProfilePictureHandler",
      {
        runtime: lambda.Runtime.NODEJS_10_X,
        code: new lambda.AssetCode("src"),
        handler: "removePicture.handler",
        environment: {
          USERS_TABLE_NAME: usersTable.tableName,
        },
      }
    );

    const removeProfilePictureIntegration = new apigw.LambdaIntegration(
      removeProfilePicture
    );
    pictureResource.addMethod("GET", removeProfilePictureIntegration);
    usersTable.grantReadWriteData(removeProfilePicture as any);

    const addUserIntegration = new apigw.LambdaIntegration(addUser);
    userResource.addMethod("POST", addUserIntegration);
    usersTable.grantReadWriteData(addUser as any);

    const moviesResource = api.root.addResource("likeMovie");
    addCorsOptions(moviesResource);

    const likeMovie = new lambda.Function(this, "LikeMovieHandler", {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: new lambda.AssetCode("src"),
      handler: "likeMovie.handler",
      environment: {
        USERS_TABLE_NAME: usersTable.tableName,
      },
    });

    const likeMovieIntegration = new apigw.LambdaIntegration(likeMovie);
    moviesResource.addMethod("GET", likeMovieIntegration, {
      authorizationType: apigw.AuthorizationType.COGNITO,
      authorizer: { authorizerId: authorizer.ref },
    });
    usersTable.grantReadWriteData(likeMovie as any);

    const sendPairRequests = new lambda.Function(this, "SendPairRequest", {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: new lambda.AssetCode("src"),
      handler: "sendPairRequest.handler",
      environment: {
        USERS_TABLE_NAME: usersTable.tableName,
      },
    });

    const requestPairingResource = api.root.addResource("requestPairing");
    addCorsOptions(requestPairingResource);
    const requestPairingIntegration = new apigw.LambdaIntegration(
      sendPairRequests
    );

    requestPairingResource.addMethod("GET", requestPairingIntegration, {
      authorizationType: apigw.AuthorizationType.COGNITO,
      authorizer: { authorizerId: authorizer.ref },
    });
    usersTable.grantReadWriteData(sendPairRequests as any);

    const cancelPairingRequest = new lambda.Function(
      this,
      "CancelPairingRequest",
      {
        runtime: lambda.Runtime.NODEJS_10_X,
        code: new lambda.AssetCode("src"),
        handler: "cancelPairingRequest.handler",
        environment: {
          USERS_TABLE_NAME: usersTable.tableName,
        },
      }
    );

    const cancelPairingResource = api.root.addResource("cancelPairing");
    addCorsOptions(cancelPairingResource);
    const cancelPairingIntegration = new apigw.LambdaIntegration(
      cancelPairingRequest
    );

    cancelPairingResource.addMethod("GET", cancelPairingIntegration, {
      authorizationType: apigw.AuthorizationType.COGNITO,
      authorizer: { authorizerId: authorizer.ref },
    });
    usersTable.grantReadWriteData(cancelPairingRequest as any);

    const acceptIncomingRequest = new lambda.Function(
      this,
      "AcceptIncomingRequest",
      {
        runtime: lambda.Runtime.NODEJS_10_X,
        code: new lambda.AssetCode("src"),
        handler: "acceptIncomingRequest.handler",
        environment: {
          USERS_TABLE_NAME: usersTable.tableName,
        },
      }
    );

    const acceptIncomingResource = api.root.addResource(
      "acceptIncomingRequest"
    );
    addCorsOptions(acceptIncomingResource);
    const acceptIncomingRequestIntegration = new apigw.LambdaIntegration(
      acceptIncomingRequest
    );

    acceptIncomingResource.addMethod("GET", acceptIncomingRequestIntegration, {
      authorizationType: apigw.AuthorizationType.COGNITO,
      authorizer: { authorizerId: authorizer.ref },
    });
    usersTable.grantReadWriteData(acceptIncomingRequest as any);

    const rejectIncomingRequest = new lambda.Function(
      this,
      "RejectIncomingRequest",
      {
        runtime: lambda.Runtime.NODEJS_10_X,
        code: new lambda.AssetCode("src"),
        handler: "rejectIncomingRequest.handler",
        environment: {
          USERS_TABLE_NAME: usersTable.tableName,
        },
      }
    );

    const rejectIncomingResource = api.root.addResource(
      "rejectIncomingRequest"
    );
    addCorsOptions(rejectIncomingResource);
    const rejectIncomingRequestIntegration = new apigw.LambdaIntegration(
      rejectIncomingRequest
    );

    rejectIncomingResource.addMethod("GET", rejectIncomingRequestIntegration, {
      authorizationType: apigw.AuthorizationType.COGNITO,
      authorizer: { authorizerId: authorizer.ref },
    });
    usersTable.grantReadWriteData(rejectIncomingRequest as any);

    const breakUpPartnership = new lambda.Function(this, "BreakUpPartnership", {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: new lambda.AssetCode("src"),
      handler: "breakUpPartnership.handler",
      environment: {
        USERS_TABLE_NAME: usersTable.tableName,
      },
    });

    const breakUpPartnershipResource = api.root.addResource(
      "breakUpPartnership"
    );
    addCorsOptions(breakUpPartnershipResource);
    const breakUpPartnershipIntegration = new apigw.LambdaIntegration(
      breakUpPartnership
    );

    breakUpPartnershipResource.addMethod("GET", breakUpPartnershipIntegration, {
      authorizationType: apigw.AuthorizationType.COGNITO,
      authorizer: { authorizerId: authorizer.ref },
    });
    usersTable.grantReadWriteData(breakUpPartnership as any);

    const randomizeProfilePicture = new lambda.Function(
      this,
      "RandomizeProfilePicture",
      {
        runtime: lambda.Runtime.NODEJS_10_X,
        code: new lambda.AssetCode("src"),
        handler: "randomizeProfilePicture.handler",
        environment: {
          USERS_TABLE_NAME: usersTable.tableName,
        },
      }
    );

    const randomizeProfilePictureResource = api.root.addResource(
      "randomizeProfilePicture"
    );
    addCorsOptions(randomizeProfilePictureResource);
    const randomizeProfilePictureIntegration = new apigw.LambdaIntegration(
      randomizeProfilePicture
    );

    randomizeProfilePictureResource.addMethod(
      "GET",
      randomizeProfilePictureIntegration,
      {
        authorizationType: apigw.AuthorizationType.COGNITO,
        authorizer: { authorizerId: authorizer.ref },
      }
    );
    usersTable.grantReadWriteData(randomizeProfilePicture as any);

    // need to add bucket policy to s3 bucket
    //   {
    //     "Version": "2012-10-17",
    //     "Statement": [
    //         {
    //             "Sid": "PublicReadGetObject",
    //             "Effect": "Allow",
    //             "Principal": "*",
    //             "Action": [
    //                 "s3:GetObject",
    //                 "s3:ListBucket",
    //                 "s3:PutObject"
    //             ],
    //             "Resource": [
    //                 "arn:aws:s3:::couplesmoviepickerbacken-profilepicturesbucketa8b-wzbj5zhprz9k",
    //                 "arn:aws:s3:::couplesmoviepickerbacken-profilepicturesbucketa8b-wzbj5zhprz9k/*"
    //             ]
    //         }
    //     ]
    // }

    new s3.Bucket(this, "profilePicturesBucket", {
      cors: [
        {
          allowedOrigins: ["*"],
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.DELETE,
            s3.HttpMethods.POST,
            s3.HttpMethods.PUT,
            s3.HttpMethods.HEAD,
          ],
          allowedHeaders: ["*"],
        },
      ],
    });
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
