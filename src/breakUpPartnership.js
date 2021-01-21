const AWS = require("aws-sdk");
const headers = require("./constants");
const {
  getFetchUserParams,
  getRemovePartnerAttributeParams,
  getRemoveIncomingRequestsAttributeParams,
} = require("./functions");

const fetchUser = async (tableName, givenUsername) => {
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

const validateUserInput = (event) => {
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

exports.handler = async function (event) {
  if (validateUserInput(event)) {
    const dynamodb = new AWS.DynamoDB();
    try {
      const fetchRequesterUserResponse = await fetchUser(
        process.env.USERS_TABLE_NAME,
        event.requestContext.authorizer.claims["cognito:username"]
      );
      const fetchTargetUserResponse = await fetchUser(
        process.env.USERS_TABLE_NAME,
        event.queryStringParameters.username
      );
      const requesterAndTargetHavePartnerAttribute =
        fetchRequesterUserResponse.Item.partner &&
        fetchTargetUserResponse.Item.partner;
      const partneredEqualsEachother =
        fetchRequesterUserResponse.Item.partner.S ===
          event.queryStringParameters.username &&
        fetchTargetUserResponse.Item.partner.S ===
          event.requestContext.authorizer.claims["cognito:username"];
      if (requesterAndTargetHavePartnerAttribute && partneredEqualsEachother) {
        const removePartnerAttributeParams = getRemovePartnerAttributeParams(
          process.env.USERS_TABLE_NAME,
          event.requestContext.authorizer.claims["cognito:username"]
        );
        await dynamodb.updateItem(removePartnerAttributeParams).promise();
        const removeIncomingRequestsAttributeParams = getRemoveIncomingRequestsAttributeParams(
          process.env.USERS_TABLE_NAME,
          event.queryStringParameters.username
        );
        const removeIncomingRequestsAttributeResponse = await dynamodb
          .updateItem(removeIncomingRequestsAttributeParams)
          .promise();
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ removeIncomingRequestsAttributeResponse }),
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
      body: 'required query string params missing',
    };
    return response;
  }
};
