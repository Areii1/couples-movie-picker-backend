const AWS = require("aws-sdk");
const headers = require("./constants");
const {
  getRemoveOutgoingRequestsAttributeParams,
  getRemoveIncomingRequestsAttributeParams,
  getAddPartnerAttributeParams,
  getFetchUserParams,
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

const updatePerson = async (person, partner) => {
  const dynamodb = new AWS.DynamoDB();
  const removeOutgoingRequestsAttributeParams = getRemoveOutgoingRequestsAttributeParams(
    process.env.USERS_TABLE_NAME,
    person
  );
  const dbRequesterRemoveORResponse = await dynamodb
    .updateItem(removeOutgoingRequestsAttributeParams)
    .promise();
  console.log(dbRequesterRemoveORResponse, "dbRequesterRemoveORResponse");
  const removeIncomingRequestsAttributeParams = getRemoveIncomingRequestsAttributeParams(
    process.env.USERS_TABLE_NAME,
    person
  );
  const dbRequesterRemoveIRResponse = await dynamodb
    .updateItem(removeIncomingRequestsAttributeParams)
    .promise();
  console.log(dbRequesterRemoveIRResponse, "dbRequesterRemoveIRResponse");
  const addPartnerAttributeParams = getAddPartnerAttributeParams(
    process.env.USERS_TABLE_NAME,
    person,
    partner
  );
  const dbRequesterAddResponse = await dynamodb
    .updateItem(addPartnerAttributeParams)
    .promise();
  console.log(dbRequesterAddResponse, "dbRequesterAddResponse");
};

exports.handler = async function (event) {
  if (validateUserInput(event)) {
    try {
      const fetchRequestedUserResponse = await fetchUser(
        process.env.USERS_TABLE_NAME,
        event.queryStringParameters.username
      );
      const outgoingMatchesRequester =
        fetchRequestedUserResponse.Item.outgoingRequests.S ===
        event.requestContext.authorizer.claims["cognito:username"];
      console.log(outgoingMatchesRequester, "outgoingMatchesRequester");
      if (outgoingMatchesRequester) {
        await updatePerson(
          event.requestContext.authorizer.claims["cognito:username"],
          event.queryStringParameters.username
        );
        await updatePerson(
          event.queryStringParameters.username,
          event.requestContext.authorizer.claims["cognito:username"]
        );
        return {
          statusCode: 200,
          headers,
          body: "success",
        };
      } else {
        return {
          statusCode: 400,
          headers,
          body: "no outgoing request exists",
        };
      }
    } catch (incomingUpdateError) {
      console.log(incomingUpdateError, "incomingUpdateError");
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
      body: "missing required query strings",
    };
    return response;
  }
};
