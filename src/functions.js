const getFetchUserParams = (tableName, givenUsername) => {
  return {
    TableName: tableName,
    Key: {
      username: {
        S: givenUsername,
      },
    },
  };
};

const validateQueryStringUsername = (event) => {
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

const getRemoveOutgoingRequestsAttributeParams = (
  tableName,
  person
) => ({
  Key: {
    username: {
      S: person,
    },
  },
  TableName: tableName,
  UpdateExpression: "REMOVE #or",
  ExpressionAttributeNames: {
    "#or": "outgoingRequests",
  },
  ReturnValues: "UPDATED_NEW",
});

const getRemoveIncomingRequestsAttributeParams = (
  tableName,
  person
) => ({
  Key: {
    username: {
      S: person,
    },
  },
  TableName: tableName,
  UpdateExpression: "REMOVE #ir",
  ExpressionAttributeNames: {
    "#ir": "incomingRequests",
  },
  ReturnValues: "UPDATED_NEW",
});

const getAddPartnerAttributeParams = (
  tableName,
  person,
  partner
) => ({
  Key: {
    username: {
      S: person,
    },
  },
  TableName: tableName,
  UpdateExpression: "SET #pa = :p",
  ConditionExpression: "attribute_not_exists(#pa)",
  ExpressionAttributeNames: {
    "#pa": "partner",
  },
  ExpressionAttributeValues: {
    ":p": { S: partner },
  },
  ReturnValues: "UPDATED_NEW",
});

const getAddOutgoingRequestsParams = (
  tableName,
  person,
  targetPerson
) => ({
  Key: {
    username: {
      S: person,
    },
  },
  TableName: tableName,
  UpdateExpression: "SET #or = :i",
  ConditionExpression: "attribute_not_exists(#or)",
  ExpressionAttributeNames: {
    "#or": "outgoingRequests",
  },
  ExpressionAttributeValues: {
    ":i": { S: targetPerson },
  },
  ReturnValues: "UPDATED_NEW",
});

const getAddIncomingRequestsAttributeParams = (
  tableName,
  requesterPerson,
  requestedPerson
) => ({
  Key: {
    username: {
      S: requesterPerson,
    },
  },
  TableName: tableName,
  UpdateExpression: "SET #ir = :i",
  ExpressionAttributeNames: {
    "#ir": "incomingRequests",
  },
  ExpressionAttributeValues: {
    ":i": {
      SS: [requestedPerson],
    },
  },
  ReturnValues: "UPDATED_NEW",
});

const getAddToIncomingRequestsParams = (
  tableName,
  requesterPerson,
  requestedPerson
) => ({
  Key: {
    username: {
      S: requesterPerson,
    },
  },
  TableName: tableName,
  UpdateExpression: "ADD incomingRequests :incomingRequests",
  ExpressionAttributeValues: {
    ":incomingRequests": {
      SS: [requestedPerson],
    },
  },
  ReturnValues: "UPDATED_NEW",
});

const getRemoveProfilePictureAttributeParams = (
  tableName,
  person
) => ({
  Key: {
    username: {
      S: person,
    },
  },
  TableName: tableName,
  UpdateExpression: "REMOVE #pp",
  ExpressionAttributeNames: {
    "#pp": "profilePicture",
  },
  ReturnValues: "UPDATED_NEW",
});

const getSubtractItemFromIncomingRequestsListParams = (
  tableName,
  rejector,
  rejectee
) => ({
  Key: {
    username: {
      S: rejector,
    },
  },
  TableName: tableName,
  UpdateExpression: "DELETE incomingRequests :incomingRequests",
  ExpressionAttributeValues: {
    ":incomingRequests": {
      SS: [rejectee],
    },
  },
  ReturnValues: "UPDATED_NEW",
});

const getSetProfilePictureAttributeParams = (
  tableName,
  person,
  path
) => ({
  Key: {
    username: {
      S: person,
    },
  },
  TableName: tableName,
  UpdateExpression: "SET #pp = :p",
  ExpressionAttributeNames: {
    "#pp": "profilePicture",
  },
  ExpressionAttributeValues: {
    ":p": { S: path },
  },
  ReturnValues: "UPDATED_NEW",
});

const getRemovePartnerAttributeParams = (
  tableName,
  person
) => ({
  Key: {
    username: {
      S: person,
    },
  },
  TableName: tableName,
  UpdateExpression: "REMOVE #pa",
  ExpressionAttributeNames: {
    "#pa": "partner",
  },
  ReturnValues: "UPDATED_NEW",
});

module.exports.getRemoveOutgoingRequestsAttributeParams = getRemoveOutgoingRequestsAttributeParams;
module.exports.getRemoveIncomingRequestsAttributeParams = getRemoveIncomingRequestsAttributeParams;
module.exports.getAddPartnerAttributeParams = getAddPartnerAttributeParams;
module.exports.getAddOutgoingRequestsParams = getAddOutgoingRequestsParams;
module.exports.getFetchUserParams = getFetchUserParams;
module.exports.validateQueryStringUsername = validateQueryStringUsername;
module.exports.getAddIncomingRequestsAttributeParams = getAddIncomingRequestsAttributeParams;
module.exports.getAddToIncomingRequestsParams = getAddToIncomingRequestsParams;
module.exports.getRemoveProfilePictureAttributeParams = getRemoveProfilePictureAttributeParams;
module.exports.getSubtractItemFromIncomingRequestsListParams = getSubtractItemFromIncomingRequestsListParams;
module.exports.getSetProfilePictureAttributeParams = getSetProfilePictureAttributeParams;
module.exports.getRemovePartnerAttributeParams = getRemovePartnerAttributeParams;
