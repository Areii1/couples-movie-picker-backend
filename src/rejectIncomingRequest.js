export {};

const AWS = require("aws-sdk");
const headers = require("./constants");
const {
  validateQueryStringUsername,
  getFetchUserParams,
  getSubtractItemFromIncomingRequestsListParams,
  getRemoveOutgoingRequestsAttributeParams,
} = require("./functions");

const fetchUser = async (tableName, givenUsername) => {
  try {
    const dynamodb = new AWS.DynamoDB();
    const fetchUserParams = getFetchUserParams(tableName, givenUsername);
    const databaseGetResponse = await dynamodb
      .getItem(fetchUserParams)
      .promise();
    return databaseGetResponse;
  } catch (databaseGetItemError) {
    return databaseGetItemError;
  }
};

exports.handler = async function (event) {
  if (validateQueryStringUsername(event)) {
    const dynamodb = new AWS.DynamoDB();
    try {
      const fetchRequestedUserResponse = await fetchUser(
        process.env.USERS_TABLE_NAME,
        event.requestContext.authorizer.claims["cognito:username"]
      );
      const fetchRequesterResponse = await fetchUser(
        process.env.USERS_TABLE_NAME,
        event.queryStringParameters.username
      );
      const incomingRequestExistsOnRequested =
        fetchRequestedUserResponse.Item.incomingRequests.SS.find(
          (request) => request === event.queryStringParameters.username
        ) !== undefined;
      const outgoingRequestExistsOnRequester =
        fetchRequesterResponse.Item.outgoingRequests.S ===
        event.requestContext.authorizer.claims["cognito:username"];
      if (
        incomingRequestExistsOnRequested &&
        outgoingRequestExistsOnRequester
      ) {
        const subtractItemFromIncomingRequestsListParams = getSubtractItemFromIncomingRequestsListParams(
          process.env.USERS_TABLE_NAME,
          event.requestContext.authorizer.claims["cognito:username"],
          event.queryStringParameters.username
        );
        const subtractItemFromIncomingRequestsListResponse = await dynamodb
          .updateItem(subtractItemFromIncomingRequestsListParams)
          .promise();
        const removeOutgoingRequestsAttributeParams = getRemoveOutgoingRequestsAttributeParams(
          process.env.USERS_TABLE_NAME,
          event.queryStringParameters.username
        );
        await dynamodb
          .updateItem(removeOutgoingRequestsAttributeParams)
          .promise();
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ subtractItemFromIncomingRequestsListResponse }),
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
