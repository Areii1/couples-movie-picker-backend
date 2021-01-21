export {};

const AWS = require("aws-sdk");
const headers = require("./constants");
const {
  getFetchUserParams,
  getRemoveOutgoingRequestsAttributeParams,
} = require("./functions");

const fetchUser = async (tableName: string, givenUsername: string) => {
  try {
    const fetchUserParams = getFetchUserParams(tableName, givenUsername);
    const dynamodb = new AWS.DynamoDB();
    const databaseGetResponse = await dynamodb
      .getItem(fetchUserParams)
      .promise();
    return databaseGetResponse;
  } catch (databaseGetItemError) {
    return databaseGetItemError;
  }
};

const validateUserInput = (event: any) => {
  if (event.queryStringParameters) {
    if (event.queryStringParameters.username) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
};

exports.handler = async function (event: any) {
  if (validateUserInput(event)) {
    const dynamodb = new AWS.DynamoDB();
    try {
      const fetchUserResponse = await fetchUser(
        process.env.USERS_TABLE_NAME as string,
        event.requestContext.authorizer.claims["cognito:username"]
      );
      if (fetchUserResponse.Item.outgoingRequests) {
        const removeOutgoingRequestsAttributeParams = getRemoveOutgoingRequestsAttributeParams(
          process.env.USERS_TABLE_NAME,
          event.requestContext.authorizer.claims["cognito:username"]
        );
        const removeOutgoingRequestsAttributeResponse = await dynamodb
          .updateItem(removeOutgoingRequestsAttributeParams)
          .promise();
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ removeOutgoingRequestsAttributeResponse }),
        };
      } else {
        return {
          statusCode: 400,
          headers,
          body: "no outgoing request exists",
        };
      }
    } catch (incomingUpdateError) {
      const response = {
        statusCode: 500,
        headers,
        body: "could not add request to receiver",
      };
      return response;
    }
  } else {
    const response = {
      statusCode: 400,
      headers,
      body: "required query string parameters missing",
    };
    return response;
  }
};
