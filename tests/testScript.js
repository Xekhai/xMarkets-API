// const {
//   transferAlgo,
//   transferASA,
//   getAssetHolders,
//   verifyPaymentTransaction,
//   verifyAsaTransaction,
// } = require("./blockchain/algorand");
// const {
//   createNewMarket,
//   calculateSharePurchaseCost,
//   getMarketByID,
//   getAllMarkets,
//   calculateSharePurchaseAmount,
//   calculateShareSaleAmount,
// } = require("./markets/marketManager");
// const {
//   executeSharePurchase,
//   executeShareSale,
// } = require("./trading/tradingEngine");

// // Call the createNewMarket function with example details
// const marketName = 'Example Market';
// const marketDescription = 'This is an example market';
// const tokenShareCount = 50000;
// const AlgoCommitted = 2000;

// createNewMarket(marketName, marketDescription, tokenShareCount, AlgoCommitted, "2023-09-19T23:00:00.000Z", "2023-09-29T23:00:00.000Z");

// calculateSharePurchaseCost('Nh9Sz37w8p8HWPU2bt3m', "YES", 250);
// calculateSharePurchaseAmount('Nh9Sz37w8p8HWPU2bt3m', "YES", 15);
// calculateShareSaleAmount("Nh9Sz37w8p8HWPU2bt3m", "no", 200)
// getMarketByID("Nh9Sz37w8p8HWPU2bt3m");
// getAllMarkets().then(
//     results =>{
//         console.log(results);
//     }
// );

// transferAlgo(1,'3WXUWVYYPFQ66WHA7DLQOXC2N5EEUDUPC7BBXDS3JFTSF3HOBBZ65VCCS4');
// transferASA(259348541, 500, '3WXUWVYYPFQ66WHA7DLQOXC2N5EEUDUPC7BBXDS3JFTSF3HOBBZ65VCCS4');
// getAssetHolders(259348541);
//
// verifyAsaTransaction('5D63ZMK2YGQIVOYYSKFCIP24CO5DX7HZESCTFXOU4WAYHRJ3HMNQ', 259348541, 'XMPAEQVSMBALMROXBTFCQ6EKFRX5CAV24ENPGLTSP3527M5JZ6ZTGYX66Y', '3WXUWVYYPFQ66WHA7DLQOXC2N5EEUDUPC7BBXDS3JFTSF3HOBBZ65VCCS4', 500).then(
//     result=> {
//         console.log(result)
//     }
// )

// executeSharePurchase('EQ4HF4ZFGI7RACI2N5DGLZMVYGZN4HFATSSITLSINBEOZSDCLV2A','3WXUWVYYPFQ66WHA7DLQOXC2N5EEUDUPC7BBXDS3JFTSF3HOBBZ65VCCS4','XMPAEQVSMBALMROXBTFCQ6EKFRX5CAV24ENPGLTSP3527M5JZ6ZTGYX66Y',15,'Nh9Sz37w8p8HWPU2bt3m', 0.1, 41,"YES").then(status =>{
//     console.log (status);
// });
// executeShareSale('PUAL76W6Q746EX2T5X4I6FNMTHWGJJVTBWB4XSBUURZVF6IOR4OQ','3WXUWVYYPFQ66WHA7DLQOXC2N5EEUDUPC7BBXDS3JFTSF3HOBBZ65VCCS4','XMPAEQVSMBALMROXBTFCQ6EKFRX5CAV24ENPGLTSP3527M5JZ6ZTGYX66Y',200,'Nh9Sz37w8p8HWPU2bt3m', 0.1, 11.3,'No')
