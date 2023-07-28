const express = require("express");
const router = express.Router();
const { body, validationResult, check } = require("express-validator");
require("dotenv").config();

const {
  executeSharePurchase,
  executeShareSale,
} = require("../trading/tradingEngine");
const {
  createNewMarket,
  getMarketByID,
  getAllMarkets,
} = require("../markets/marketManager");
const {
  calculateShareSaleAmount,
  calculateSharePurchaseAmount,
} = require("../markets/marketManager");

const wrapAsync = (fn) => {
  return function (req, res, next) {
    fn(req, res, next).catch(next);
  };
};
// Middleware to check for secret key
function checkSecretKey(req, res, next) {
  const secretKey = req.headers["x-api-key"];

  if (secretKey && secretKey === process.env.SECRET_KEY) {
    next();
  } else {
    res.status(403).json({
      message: "Unauthorized, You're not allowed to do that, my Gee!",
    });
  }
}
// Create a new market
router.post(
  "/create",
  checkSecretKey,
  [
    body("marketName")
      .isString()
      .isLength({ min: 5, max: 25 })
      .withMessage("Market name must be a string between 5 and 25 characters."),
    body("marketDescription")
      .isString()
      .isLength({ min: 10, max: 125 })
      .withMessage(
        "Market description must be a string between 10 and 125 characters.",
      ),
    body("tokenShareCount")
      .isInt({ min: 1 })
      .withMessage(
        "Token share count must be a non-decimal number greater than 0.",
      ),
    body("algoCommitted")
      .isFloat({ min: 50.0 })
      .withMessage(
        "Algo committed must be a decimal number greater than 50.0.",
      ),
  ],
  wrapAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const marketData = req.body;
    const result = await createNewMarket(
      marketData.marketName,
      marketData.marketDescription,
      marketData.tokenShareCount,
      marketData.algoCommitted,
      marketData.expiryDate,
      marketData.resolutionDate,
    );
    res.json(result);
  }),
);

// Execute a trade
router.post(
  "/executeTrade",
  [
    body("transactionId")
      .isString()
      .isLength({ min: 52, max: 52 })
      .withMessage("Transaction ID must be a string of 52 characters."),
    body("sender")
      .isString()
      .isLength({ min: 58, max: 58 })
      .withMessage("Sender must be a string of 58 characters."),
    body("receiver")
      .isString()
      .isLength({ min: 58, max: 58 })
      .withMessage("Receiver must be a string of 58 characters."),
    body("sharesOrAmount").custom((value, { req }) => {
      if (req.body.tradeType === "sale" && !Number.isInteger(value)) {
        throw new Error("Shares for sale must be an integer");
      } else if (req.body.tradeType === "purchase" && isNaN(value)) {
        throw new Error("Amount for purchase must be a decimal");
      }
      return true;
    }),
    body("marketId")
      .isString()
      .isLength({ min: 5 })
      .withMessage("Market ID must be a string of minimum 5 characters."),
    body("slippageAllowed")
      .isFloat({ min: 0, max: 1 })
      .withMessage("Slippage allowed must be a decimal between 0 and 1."),
    body("expectedSharesOrAlgos").custom((value, { req }) => {
      if (req.body.tradeType === "purchase" && !Number.isInteger(value)) {
        throw new Error("Expected shares for purchase must be an integer");
      } else if (req.body.tradeType === "sale" && isNaN(value)) {
        throw new Error("Expected Algos for sale must be a decimal");
      }
      return true;
    }),
    body("shareType")
      .isIn(["yes", "no"])
      .withMessage('Share type must be either "yes" or "no".'),
    body("tradeType")
      .isIn(["purchase", "sale"])
      .withMessage('Trade type must be either "purchase" or "sale".'),
  ],
  wrapAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const tradeData = req.body;
    let result;
    if (tradeData.tradeType === "sale") {
      result = await executeShareSale(
        tradeData.transactionId,
        tradeData.sender,
        tradeData.receiver,
        tradeData.sharesOrAmount,
        tradeData.marketId,
        tradeData.slippageAllowed,
        tradeData.expectedSharesOrAlgos,
        tradeData.shareType,
      );
    } else if (tradeData.tradeType === "purchase") {
      result = await executeSharePurchase(
        tradeData.transactionId,
        tradeData.sender,
        tradeData.receiver,
        tradeData.sharesOrAmount,
        tradeData.marketId,
        tradeData.slippageAllowed,
        tradeData.expectedSharesOrAlgos,
        tradeData.shareType,
      );
    }
    res.json(result);
  }),
);

// Calculate the Algos that will be received from selling a number of shares
router.post(
  "/calculateShareSale",
  [
    body("marketId")
      .isString()
      .isLength({ min: 5 })
      .withMessage("Market ID must be a string of minimum 5 characters."),
    body("shareType")
      .isIn(["yes", "no"])
      .withMessage('Share type must be either "yes" or "no".'),
    body("shares")
      .isInt({ gt: 0 })
      .withMessage("Shares must be an integer greater than 0."),
  ],
  wrapAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { marketId, shareType, shares } = req.body;
    const result = await calculateShareSaleAmount(marketId, shareType, shares);
    res.json({ result });
  }),
);

// Calculate the shares that will be purchased with a certain number of Algos
router.post(
  "/calculateSharePurchase",
  [
    body("marketId")
      .isString()
      .isLength({ min: 5 })
      .withMessage("Market ID must be a string of minimum 5 characters."),
    body("shareType")
      .isIn(["yes", "no"])
      .withMessage('Share type must be either "yes" or "no".'),
    body("amount")
      .isFloat({ gt: 0.0 })
      .withMessage("Amount must be a decimal greater than 0."),
  ],
  wrapAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { marketId, shareType, amount } = req.body;
    const result = await calculateSharePurchaseAmount(
      marketId,
      shareType,
      amount,
    );
    res.json({ result });
  }),
);

// Fetch a specific market
router.get(
  "/market/:id",
  [
    check("id")
      .isString()
      .isLength({ min: 5 })
      .withMessage("Market ID must be a string of minimum 5 characters."),
  ],
  wrapAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const marketId = req.params.id;
    const result = await getMarketByID(marketId);
    res.json(result);
  }),
);

// Fetch all markets
router.get(
  "/markets",
  wrapAsync(async (req, res) => {
    const result = await getAllMarkets();
    res.json(result);
  }),
);

router.use((err, req, res) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || "Something broke!" });
});

module.exports = router;
