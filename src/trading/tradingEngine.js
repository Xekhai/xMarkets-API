const {
  verifyPaymentTransaction,
  transferASA,
  transferAlgo,
  verifyAsaTransaction,
} = require("../blockchain/algorand");
const admin = require("firebase-admin");
const {
  calculateSharePurchaseAmount,
  calculateShareSaleAmount,
} = require("../markets/marketManager");
const {
  validateExpectedAmount,
  validateShareType,
  validateSlippageAllowed,
} = require("../helpers/tradeEngineValidators");
const db = admin.firestore();

async function executeSharePurchase(
  transactionId,
  sender,
  receiver,
  amount,
  marketId,
  slippageAllowed,
  expectedShares,
  shareType,
) {
  // Validate share type
  const shareTypeResult = validateShareType(shareType);
  if (shareTypeResult !== true) return shareTypeResult;

  // Validate expected shares
  const expectedSharesResult = validateExpectedAmount(expectedShares);
  if (expectedSharesResult !== true) return expectedSharesResult;

  // Validate slippage allowed
  const slippageAllowedResult = validateSlippageAllowed(slippageAllowed);
  if (slippageAllowedResult !== true) return slippageAllowedResult;

  try {
    // Verify the payment transaction
    const verificationResult = await verifyPaymentTransaction(
      transactionId,
      sender,
      receiver,
      amount,
    );

    if (!verificationResult.validTx) {
      console.log(
        "Transaction verification failed:",
        verificationResult.reason,
      );
      // Record failed transaction
      await db.collection("transactions").doc(transactionId).set({
        status: "Failed",
        reason: verificationResult.reason,
      });
      return {
        success: false,
        reason: verificationResult.reason,
      };
    }
    let marketData;

    // Run a Firestore transaction
    let actualShares = await db.runTransaction(async (t) => {
      const marketRef = db.collection("xmp-markets").doc(marketId);
      const marketSnapshot = await t.get(marketRef);

      if (!marketSnapshot.exists) {
        throw new Error("No market data found");
      }

      marketData = marketSnapshot.data();
      // Get the current date and time
      const currentDate = new Date();

      // Check if the market has ended
      if (currentDate > new Date(marketData.resolutionDate)) {
        throw new Error("The market has ended and should be resolved.");
      }
      // Check if the market has expired
      if (currentDate > new Date(marketData.expiryDate)) {
        throw new Error("The market has expired.");
      }
      
      // Calculate the actual shares that will be purchased with the provided Algos
      let calculatedShares = await calculateSharePurchaseAmount(
        marketId,
        shareType,
        amount,
        marketData,
      );
      calculatedShares = Math.floor(calculatedShares);

      // Check if the calculation result is a number
      if (isNaN(calculatedShares)) {
        throw new Error("Error in shares calculation");
      }

      // Check if the actual shares is within the acceptable slippage
      const minAllowedShares = expectedShares * (1 - slippageAllowed);
      if (calculatedShares < minAllowedShares) {
        throw new Error(
          "The actual shares amount is less than the minimum allowed due to slippage",
        );
      }

      // Update Firestore with the new number of shares
      const newShares =
        shareType === "yes"
          ? marketData.yesShares - calculatedShares
          : marketData.noShares - calculatedShares;
      const newAlgoBalance = marketData.AlgoBalance + amount;

      // Check if the newShares and newAlgoBalance are numbers
      if (isNaN(newShares) || isNaN(newAlgoBalance)) {
        throw new Error("Error in calculation of new shares or Algo balance");
      }

      await t.update(marketRef, {
        [`${shareType}Shares`]: newShares,
        AlgoBalance: newAlgoBalance,
      });

      return calculatedShares;
    });

    // If all checks pass, execute the trade by sending the shares to the purchaser
    const assetID =
      shareType === "yes" ? marketData.yesAssetId : marketData.noAssetId;
    await transferASA(assetID, actualShares, sender);

    console.log("Trade executed successfully");
    // Record successful transaction
    await db.collection("transactions").doc(transactionId).set({
      status: "Successful",
      shares: actualShares,
    });

    return {
      success: true,
      reason: "Trade executed successfully",
    };
  } catch (error) {
    console.error(`Error executing share purchase: ${error}`);
    // Transfer Algos back to sender
    transferAlgo(amount - 0.002, sender); // Deducting 0.002 Algo for transaction cost
    // Record failed transaction
    await db
      .collection("transactions")
      .doc(transactionId)
      .set({
        status: "Failed",
        reason: `Error executing share purchase: ${error}`,
      });
    return {
      success: false,
      reason: `Error executing share purchase: ${error}`,
    };
  }
}

async function executeShareSale(
  transactionId,
  sender,
  receiver,
  shares,
  marketId,
  slippageAllowed,
  expectedAlgos,
  shareType,
) {
  // Validate share type
  const shareTypeResult = validateShareType(shareType);
  if (shareTypeResult !== true) return shareTypeResult;

  // Validate expected algos
  const expectedAlgosResult = validateExpectedAmount(expectedAlgos);
  if (expectedAlgosResult !== true) return expectedAlgosResult;

  // Validate slippage allowed
  const slippageAllowedResult = validateSlippageAllowed(slippageAllowed);
  if (slippageAllowedResult !== true) return slippageAllowedResult;

  let assetID;
  try {
    let marketData;
    // Fetch the market data
    const marketRef = db.collection("xmp-markets").doc(marketId);
    const marketSnapshot = await marketRef.get();

    if (!marketSnapshot.exists) {
      throw new Error("No market data found");
    }
    marketData = marketSnapshot.data();
    // Get the current date and time
    const currentDate = new Date();

    // Check if the market has ended
    if (currentDate > new Date(marketData.resolutionDate)) {
      throw new Error("The market has ended and should be resolved.");
    }
    // Check if the market has expired
    if (currentDate > new Date(marketData.expiryDate)) {
      throw new Error("The market has expired.");
    }

    // Verify the share transaction
    assetID =
      shareType === "yes" ? marketData.yesAssetId : marketData.noAssetId;
    const verificationResult = await verifyAsaTransaction(
      transactionId,
      assetID,
      sender,
      receiver,
      shares,
    );

    if (!verificationResult.validTx) {
      console.log(
        "Transaction verification failed:",
        verificationResult.reason,
      );
      // Record failed transaction
      await db.collection("transactions").doc(transactionId).set({
        status: "Failed",
        reason: verificationResult.reason,
      });
      return {
        success: false,
        reason: verificationResult.reason,
      };
    }

    // Run a Firestore transaction
    let actualAmount = await db.runTransaction(async (t) => {
      // Calculate the Algos that will be received by selling the provided shares
      let calculatedAmount = await calculateShareSaleAmount(
        marketId,
        shareType,
        shares,
      );
      calculatedAmount = Math.floor(calculatedAmount);

      // Check if the actual amount is within the acceptable slippage
      const minAllowedAmount = expectedAlgos * (1 - slippageAllowed);
      if (calculatedAmount < minAllowedAmount) {
        throw new Error(
          "The actual Algo amount is less than the minimum allowed due to slippage",
        );
      }

      // Update Firestore with the new number of shares
      const newShares =
        shareType === "yes"
          ? marketData.yesShares + shares
          : marketData.noShares + shares;
      const newAlgoBalance = marketData.AlgoBalance - calculatedAmount;

      await t.update(marketRef, {
        [`${shareType}Shares`]: newShares,
        AlgoBalance: newAlgoBalance,
      });

      return calculatedAmount;
    });

    // If all checks pass, execute the trade by sending the Algos to the seller
    await transferAlgo(actualAmount - (0.002 + actualAmount * 0.05), sender); // Deducting 0.002 Algo for transaction cost

    console.log("Trade executed successfully");
    // Record successful transaction
    await db.collection("transactions").doc(transactionId).set({
      status: "Successful",
      Algos: actualAmount,
    });

    return {
      success: true,
      reason: "Trade executed successfully",
    };
  } catch (error) {
    console.error(`Error executing share sale: ${error}`);
    // Transfer shares back to sender
    transferASA(assetID, shares, sender);
    // Record failed transaction
    await db
      .collection("transactions")
      .doc(transactionId)
      .set({
        status: "Failed",
        reason: `Error executing share sale: ${error}`,
      });
    return {
      success: false,
      reason: `Error executing share sale: ${error}`,
    };
  }
}

module.exports = {
  executeShareSale,
};

module.exports = {
  executeSharePurchase,
  executeShareSale,
};
