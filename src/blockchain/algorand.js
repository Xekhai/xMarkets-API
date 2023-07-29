require("dotenv").config();
const algosdk = require("algosdk");
const axios = require("axios");
const db = require("../database/firestore");

const token = { "X-API-Key": process.env.ALGO_API_KEY };
const server = process.env.ALGO_SERVER;
const port = process.env.ALGO_PORT;
const mnemonic = process.env.ALGO_MNEMONIC;
const creatorAccount = algosdk.mnemonicToSecretKey(mnemonic);

const ASSET_URL = "https://xmp.app";
const DEFAULT_FROZEN = false;
const DECIMALS = 0;

const client = getClient();

function getClient() {
  try {
    const client = new algosdk.Algodv2(token, server, port);
    return client;
  } catch (error) {
    console.error(`Error configuring Algo client: ${error}`);
    throw error;
  }
}

async function transfer(operation, ...args) {
  try {
    const suggestedParams = await client.getTransactionParams().do();
    const txn = operation(creatorAccount.addr, ...args, suggestedParams);
    const signedTxn = txn.signTxn(creatorAccount.sk);
    const { txId } = await client.sendRawTransaction(signedTxn).do();
    await algosdk.waitForConfirmation(client, txId, 4);
    return txId;
  } catch (error) {
    console.error(`Error during transaction: ${error}`);
    throw error;
  }
}

async function createASA(assetName, assetUnitName, totalIssuance) {
  try {
    let suggestedParams = await client.getTransactionParams().do();

    const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
      from: creatorAccount.addr,
      suggestedParams,
      defaultFrozen: DEFAULT_FROZEN,
      unitName: assetUnitName,
      assetName: assetName,
      manager: creatorAccount.addr,
      reserve: creatorAccount.addr,
      freeze: creatorAccount.addr,
      clawback: creatorAccount.addr,
      assetURL: ASSET_URL,
      total: totalIssuance,
      decimals: DECIMALS,
    });

    const signedTxn = txn.signTxn(creatorAccount.sk);
    await client.sendRawTransaction(signedTxn).do();
    const result = await algosdk.waitForConfirmation(
      client,
      txn.txID().toString(),
      3,
    );

    const assetIndex = result["asset-index"];

    return assetIndex;
  } catch (error) {
    console.error(`Error during ASA creation: ${error}`);
    throw error;
  }
}

async function getAssetHolders(assetId) {
  const config = {
    method: "get",
    url: `https://testnet-algorand.api.purestake.io/idx2/v2/assets/${assetId}/balances`,
    headers: {
      accept: "application/json",
      "x-api-key": process.env.ALGO_API_KEY,
    },
  };

  try {
    let response = await axios(config);
    let holders = response.data.balances.map((h) => {
      return {
        address: h.address,
        amount: h.amount,
      };
    });

    return holders;
  } catch (error) {
    console.error(`Error during fetching asset holders: ${error}`);
    throw error;
  }
}

async function getTransaction(transactionId) {
  const response = await axios.get(
    `https://testnet-algorand.api.purestake.io/idx2/v2/transactions/${transactionId}`,
    {
      headers: {
        accept: "application/json",
        "x-api-key": process.env.ALGO_API_KEY,
      },
    },
  );

  return response.data.transaction;
}

async function verifyPaymentTransaction(
  transactionId,
  sender,
  receiver,
  amount,
) {
  amount = algosdk.algosToMicroalgos(amount);
  try {
    const transaction = await getTransaction(transactionId);

    if (transaction["tx-type"] !== "pay") {
      return {
        validTx: false,
        reason: "Transaction type mismatch",
      };
    }

    if (
      transaction.sender !== sender ||
      transaction["payment-transaction"].receiver !== receiver ||
      transaction["payment-transaction"].amount !== amount
    ) {
      return {
        validTx: false,
        reason: "Transaction Data mismatch",
      };
    }

    const existingTransaction = await db
      .collection("transactions")
      .doc(transactionId)
      .get();

    if (existingTransaction.exists) {
      return {
        validTx: false,
        reason: "Transaction has been processed before",
      };
    }

    return {
      validTx: true,
      reason: "Transaction is V.A LIIIID",
    };
  } catch (error) {
    console.error(`Error verifying Algo Tx: ${error}`);
    throw error;
  }
}

async function verifyAsaTransaction(
  transactionId,
  assetId,
  sender,
  receiver,
  amount,
) {
  try {
    const transaction = await getTransaction(transactionId);

    if (transaction["tx-type"] !== "axfer") {
      return {
        validTx: false,
        reason: "Transaction type mismatch",
      };
    }

    if (
      transaction["asset-transfer-transaction"]["asset-id"] !== assetId ||
      transaction.sender !== sender ||
      transaction["asset-transfer-transaction"].receiver !== receiver ||
      transaction["asset-transfer-transaction"].amount !== amount
    ) {
      return {
        validTx: false,
        reason: "Transaction Data mismatch",
      };
    }

    const existingTransaction = await db
      .collection("transactions")
      .doc(transactionId)
      .get();

    if (existingTransaction.exists) {
      return {
        validTx: false,
        reason: "Transaction has been processed before",
      };
    }

    return {
      validTx: true,
      reason: "Transaction is V.A LIIIID",
    };
  } catch (error) {
    console.error(`Error verifying Algo Tx: ${error}`);
    throw error;
  }
}

async function isAccountOptedIn(assetId, address) {
  const config = {
    method: "get",
    url: `https://testnet-algorand.api.purestake.io/idx2/v2/accounts/${address}`,
    headers: {
      accept: "application/json",
      "x-api-key": process.env.ALGO_API_KEY,
    },
  };

  try {
    let response = await axios(config);
    let assets = response.data.account.assets;

    for (let i = 0; i < assets.length; i++) {
      let asset = assets[i];
      if (asset['asset-id'] === Number(assetId)) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error(`Error during fetching account assets: ${error}`);
    throw error;
  }
}

async function createUnsignedASATransfer(assetID, amount, sender, receiver) {
  try {
    const suggestedParams = await client.getTransactionParams().do();
    const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: sender,
      to: receiver,
      assetIndex: assetID,
      amount: amount,
      suggestedParams: suggestedParams,
    });
    const txnBytes = txn.toByte();
const txnBase64 = Buffer.from(txnBytes).toString('base64');
    return txnBase64;
  } catch (error) {
    console.error(`Error during transaction creation: ${error}`);
    throw error;
  }
}

async function createUnsignedPaymentTransaction(from, to, amount) {
  try {
    const params = await client.getTransactionParams().do();
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from,
      to,
      amount: algosdk.algosToMicroalgos(amount), // converting to microAlgos
      suggestedParams: params
    });
    const txnBytes = txn.toByte();
const txnBase64 = Buffer.from(txnBytes).toString('base64');
    return txnBase64;
  } catch (error) {
    console.error(`Error during creating payment transaction: ${error}`);
    throw error;
  }
}

async function submitSignedTransaction(signedTxn) {
  try {
    const signedTxnDecoded = Buffer.from(signedTxn, "base64");
    const { txId } = await client.sendRawTransaction(signedTxnDecoded).do();
    await algosdk.waitForConfirmation(client, txId, 4);
    return txId;
  } catch (error) {
    console.error(`Error during transaction submission: ${error}`);
    throw error;
  }
}

module.exports = {
  transferAlgo: (amount, recipient) =>
    transfer(
      (from, amount, recipient, suggestedParams) =>
        algosdk.makePaymentTxnWithSuggestedParamsFromObject({
          from,
          suggestedParams,
          to: recipient,
          amount: amount * 1000000,
        }),
      amount,
      recipient,
    ),
  transferASA: (assetID, amount, recipient) =>
    transfer(
      (from, assetID, amount, recipient, suggestedParams) =>
        algosdk.makeAssetTransferTxnWithSuggestedParams(
          from,
          recipient,
          undefined,
          undefined,
          amount,
          undefined,
          assetID,
          suggestedParams,
        ),
      assetID,
      amount,
      recipient,
    ),
  createASA,
  getAssetHolders,
  verifyPaymentTransaction,
  verifyAsaTransaction,
  isAccountOptedIn,
  createUnsignedASATransfer,
  submitSignedTransaction,
  createUnsignedPaymentTransaction
};