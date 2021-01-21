const AWS = require("aws-sdk");
const headers = require("./constants");
const {
  getAddOutgoingRequestsParams,
  validateQueryStringUsername,
  getFetchUserParams,
  getAddIncomingRequestsAttributeParams,
  getAddToIncomingRequestsParams,
} = require("./functions");

exports.handler = async function (event) {
  if (validateQueryStringUsername(event)) {
    const dynamodb = new AWS.DynamoDB();
    try {
      const addOutgoingRequestsParams = getAddOutgoingRequestsParams(
        process.env.USERS_TABLE_NAME,
        event.requestContext.authorizer.claims["cognito:username"],
        event.queryStringParameters.username
      );
      const dbUpdateSenderResponse = await dynamodb
        .updateItem(addOutgoingRequestsParams)
        .promise();
      try {
        const fetchUserParams = getFetchUserParams(
          process.env.USERS_TABLE_NAME,
          event.queryStringParameters.username
        );
        const fetchUserResponse = await dynamodb
          .getItem(fetchUserParams)
          .promise();
        const updateReceiverIncomingParams = !fetchUserResponse.Item
          .incomingRequests
          ? getAddToIncomingRequestsParams(
              process.env.USERS_TABLE_NAME,
              event.queryStringParameters.username,
              event.requestContext.authorizer.claims["cognito:username"]
            )
          : getAddIncomingRequestsAttributeParams(
              process.env.USERS_TABLE_NAME,
              event.queryStringParameters.username,
              event.requestContext.authorizer.claims["cognito:username"]
            );
        const dbUpdateReceiverResponse = await dynamodb
          .updateItem(updateReceiverIncomingParams)
          .promise();
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            ir: dbUpdateSenderResponse,
            or: dbUpdateReceiverResponse,
          }),
        };
      } catch (incomingUpdateError) {
        const response = {
          statusCode: 500,
          headers,
          body: "could not add request to receiver",
        };
        return response;
      }
    } catch (dynamodbUpdateError) {
      const response = {
        statusCode: 400,
        headers,
        body: "requester already has outgoing pending request",
      };
      return response;
    }
  } else {
    const response = {
      statusCode: 400,
      headers,
      body: "no username given",
    };
    return response;
  }
};
