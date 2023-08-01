const db = require("../database/firestore");
const { createASA } = require("../blockchain/algorand");
const {
  validateDate,
  validateResolutionDate,
} = require("../helpers/dateValidator");

async function getMarketData(marketId) {
  const marketRef = db.collection("xmp-markets").doc(marketId);
  const doc = await marketRef.get();

  if (!doc.exists) {
    throw new Error(`Market with ID ${marketId} does not exist.`);
  }

  return doc.data();
}

async function validateTokenType(tokenType) {
  tokenType = tokenType.toUpperCase();

  if (tokenType !== "YES" && tokenType !== "NO") {
    throw new Error(
      `Token type is not valid. It should be either 'YES' or 'NO'.`,
    );
  }

  return tokenType;
}

async function createNewMarket(
  marketName,
  marketDescription,
  tokenShareCount,
  algoCommitted,
  expiryDate,
  resolutionDate,
) {
  console.log(`Expiry date: ${expiryDate}`);
  console.log(`Resolution date: ${resolutionDate}`);
  if (
    !validateDate(expiryDate) ||
    !validateDate(resolutionDate) ||
    !validateResolutionDate(resolutionDate, expiryDate)
  ) {
    throw new Error("Invalid date or resolution date.");
  }

  try {
    let yesAssetId = await createASA(
      `${marketName}_YES`,
      `xmp-YES`,
      tokenShareCount,
    );
    let noAssetId = await createASA(
      `${marketName}_NO`,
      `xmp-NO`,
      tokenShareCount,
    );

    let marketRef = db.collection("xmp-markets").doc();
    let marketId = marketRef.id;

    await marketRef.set({
      marketId,
      marketName,
      marketDescription,
      tokenShareCount,
      yesShares: tokenShareCount,
      noShares: tokenShareCount,
      yesAssetId,
      noAssetId,
      AlgoCommitted: algoCommitted,
      AlgoBalance: algoCommitted,
      resolved: false,
      expiryDate,
      resolutionDate,
    });
    return {
      status: `success`,
      message: `Market ${marketName} created with ID: ${marketId}`,
      marketId,
    };
  } catch (error) {
    console.error(`Error creating market: ${error}`);
    throw error;
  }
}

async function calculateShareCost(marketId, tokenType, amount, isPurchase) {
  tokenType = await validateTokenType(tokenType);
  const marketData = await getMarketData(marketId);

  const { yesShares, noShares, AlgoBalance } = marketData;
  let tokenShares, otherTokenShares;

  if (tokenType === "YES") {
    tokenShares = yesShares;
    otherTokenShares = noShares;
  } else {
    tokenShares = noShares;
    otherTokenShares = yesShares;
  }

  if (isPurchase && tokenShares <= amount) {
    throw new Error(
      "Trade amount is more than or equal to the shares available in the pool.",
    );
  }

  const invariantBefore = Math.cbrt(
    tokenShares * otherTokenShares * AlgoBalance,
  );
  const newTokenShares = isPurchase
    ? tokenShares - amount
    : tokenShares + amount;
  const AlgoBalanceAfter =
    Math.pow(invariantBefore, 3) / (otherTokenShares * newTokenShares);
  const tradeCost = isPurchase
    ? AlgoBalanceAfter - AlgoBalance
    : AlgoBalance - AlgoBalanceAfter;

  return tradeCost;
}

async function calculateSharePurchaseCost(marketId, tokenType, amount) {
  return calculateShareCost(marketId, tokenType, amount, true);
}

async function calculateSharePurchaseAmount(marketId, tokenType, AlgoAmount) {
  tokenType = await validateTokenType(tokenType);
  const marketData = await getMarketData(marketId);

  const { yesShares, noShares, AlgoBalance } = marketData;
  let tokenShares, otherTokenShares;

  if (tokenType == "YES") {
    tokenShares = yesShares;
    otherTokenShares = noShares;
  } else {
    tokenShares = noShares;
    otherTokenShares = yesShares;
  }
  const invariantBefore = Math.cbrt(
    tokenShares * otherTokenShares * AlgoBalance,
  );
  const AlgoBalanceAfter = AlgoBalance + AlgoAmount;
  const newTokenShares =
    Math.pow(invariantBefore, 3) / (otherTokenShares * AlgoBalanceAfter);
  console.log(AlgoBalance);

  const tradeAmount = tokenShares - newTokenShares;

  return tradeAmount;
}

async function calculateShareSaleAmount(marketId, tokenType, amount) {
  return calculateShareCost(marketId, tokenType, amount, false);
}

async function getMarketByID(marketId) {
  return getMarketData(marketId);
}

async function getAllMarkets() {
  const markets = [];
  const querySnapshot = await db.collection("xmp-markets").get();

  querySnapshot.forEach((doc) => {
    markets.push(doc.data());
  });

  return markets;
}

module.exports = {
  createNewMarket,
  calculateShareSaleAmount,
  calculateSharePurchaseCost,
  getMarketByID,
  getAllMarkets,
  calculateSharePurchaseAmount,
};
