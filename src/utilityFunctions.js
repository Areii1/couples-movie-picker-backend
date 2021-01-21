exports.validateUserInput = (
  event,
  requiredAttributes,
  optionalAttributes
) => {
  const parsedBody = JSON.parse(event.body);
  console.log(parsedBody, "parsedBody");
  const tooManyAttributesFound =
    requiredAttributes.length + optionalAttributes.length <
    Object.keys(parsedBody).length;
  if (!tooManyAttributesFound) {
    const requiredAttributeNotFound = requiredAttributes.some(
      (requiredAttribute) => {
        const attributeFound = Object.keys(parsedBody).some(
          (givenAttribute) => givenAttribute === requiredAttribute.name
        );
        return !attributeFound;
      }
    );
    if (requiredAttributeNotFound) {
      return false;
    } else {
      const combinedAttributes = [...requiredAttributes, ...optionalAttributes];
      const unrecognisedAttributeFound = Object.keys(parsedBody).some(
        (givenAttribute) =>
          !combinedAttributes.some(
            (attribute) => attribute.name === givenAttribute
          )
      );
      if (unrecognisedAttributeFound) {
        return false;
      } else {
        return true;
      }
    }
  } else {
    return false;
  }
};

exports.validateTriggerInput = (event, requiredAttributes) => {
  const requiredAttributeNotFound = requiredAttributes.some(
    (requiredAttribute) => {
      const attributeFound = Object.keys(event).some(
        (givenAttribute) => givenAttribute === requiredAttribute.name
      );
      console.log(attributeFound, "attributeFound");
      return !attributeFound;
    }
  );
  console.log(requiredAttributeNotFound, "requiredAttributeNotFound");
  if (requiredAttributeNotFound) {
    return false;
  } else {
    return true;
  }
};

exports.getErrorMessage = (
  event,
  requiredAttributes,
  optionalAttributes
) => {
  const combinedAttributes = [...requiredAttributes, ...optionalAttributes];
  const combinedAttributesKeys = combinedAttributes.map(
    (attribute) => attribute.name
  );
  const parsedBody = JSON.parse(event.body);
  const tooManyAttributesFound =
    requiredAttributes.length + optionalAttributes.length <
    Object.keys(parsedBody).length;
  if (!tooManyAttributesFound) {
    const requiredAttributeNotFound = requiredAttributes.find(
      (requiredAttribute) => {
        const attributeFound = Object.keys(parsedBody).some(
          (givenAttribute) => givenAttribute === requiredAttribute.name
        );
        return !attributeFound;
      }
    );
    if (requiredAttributeNotFound) {
      return `did not find required attribute: ${requiredAttributeNotFound}`;
    } else {
      const unrecognisedAttributeFound = Object.keys(parsedBody).find(
        (givenAttribute) =>
          !combinedAttributes.some(
            (attribute) => attribute.name === givenAttribute
          )
      );
      if (unrecognisedAttributeFound) {
        return `unrecognized attribute "${unrecognisedAttributeFound}" found, accepting only: [${combinedAttributesKeys.join(
          ", "
        )}]`;
      } else {
        return "";
      }
    }
  } else {
    return `too many attributes given, accepting only: [${combinedAttributesKeys.join(
      ", "
    )}]`;
  }
};
