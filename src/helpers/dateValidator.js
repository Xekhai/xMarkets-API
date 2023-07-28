module.exports.validateDate = function (date, currentDate = new Date()) {
  const dateObj = new Date(date);

  if (isNaN(dateObj.getTime())) {
    console.error("Error: The date is not valid.");
    return false;
  }

  if (dateObj < currentDate) {
    console.error("Error: The date cannot be in the past.");
    return false;
  }

  return true;
};

module.exports.validateResolutionDate = function (resolutionDate, expiryDate) {
  const resolutionDateObj = new Date(resolutionDate);
  const expiryDateObj = new Date(expiryDate);

  const timeDifference = resolutionDateObj - expiryDateObj;
  const minimumResolutionTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  if (timeDifference < minimumResolutionTime) {
    console.error(
      "Error: The resolution date must be at least 24 hours ahead of the expiry date.",
    );
    return false;
  }

  return true;
};
