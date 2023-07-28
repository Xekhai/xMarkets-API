function validateShareType(shareType) {
  shareType = shareType.toLowerCase();
  if (shareType !== "yes" && shareType !== "no") {
    console.error(`Invalid share type: ${shareType}`);
    return {
      success: false,
      reason: `Invalid share type: ${shareType}`,
    };
  }
  return true;
}

function validateExpectedAmount(expectedAmount) {
  if (typeof expectedAmount !== "number" || isNaN(expectedAmount)) {
    console.error("Invalid expected amount");
    return {
      success: false,
      reason: "Invalid expected amount",
    };
  }
  return true;
}

function validateSlippageAllowed(slippageAllowed) {
  if (
    typeof slippageAllowed !== "number" ||
    slippageAllowed < 0 ||
    slippageAllowed > 1
  ) {
    console.error("Invalid slippage allowed");
    return {
      success: false,
      reason: "Invalid slippage allowed",
    };
  }
  return true;
}

module.exports = {
  validateShareType,
  validateExpectedAmount,
  validateSlippageAllowed,
};
