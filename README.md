# xMarkets

xMarkets is an open-source prediction market built on the Algorand blockchain, powered by an Express.js backend. This project allows you to create new markets, execute trades, and fetch market data. It also provides essential backend features such as rate limiting, error handling, and data validation.

## Getting Started

These instructions will help you set up the project locally.

### Prerequisites

- Node.js: You need Node.js to run this project. You can download it from the [official site](https://nodejs.org/).
- Algorand Account: This project is built on the Algorand blockchain, so you will need an account.

### Installation

Clone the project repository:

```
git clone TODO<repo-url>
```

Navigate into the project directory:

```
cd xMarkets
```

Install the dependencies:

```
npm install
```

Of course! Here is the section to add to your README.md for environment variables:

## Environment Variables

The application uses environment variables for configuration. These are loaded from a `.env` file in the project root. Create this file and add the following variables:

```env
ALGO_API_KEY=""                  # Your Algorand API Key
ALGO_SERVER="https://testnet-algorand.api.purestake.io/ps2" # Algorand Server URL
ALGO_PORT=""                     # Algorand Server Port
ALGO_MNEMONIC=""                 # Your Algorand Account Mnemonic
FIREBASEADMIN=""                 # Your Firebase Admin SDK configuration object
```

**Note**: Make sure you replace the empty quotes (`""`) with your actual data, without adding any extra whitespace or special characters. This data is sensitive, keep your `.env` file secure and avoid committing it to your repository.

### Usage

To start the server, run:

```
node src/app.js
```

This will start the server at `localhost:3000`. You can now send HTTP requests to this server.

## API Endpoints

The server exposes several endpoints:

- POST `/api/create`: Create a new market.
- POST `/api/executeTrade`: Execute a trade.
- POST `/api/calculateShareSale`: Calculate the Algos that will be received from selling a number of shares.
- POST `/api/calculateSharePurchase`: Calculate the shares that will be purchased with a certain number of Algos.
- GET `/api/market/:id`: Fetch a specific market.
- GET `/api/markets`: Fetch all markets.

Refer to the API documentation TODO(link to documentation) for more details about these endpoints.

## Rate Limiting

To prevent abuse, the server uses rate limiting. Each IP address is limited to 350 requests every 10 minutes.

## Error Handling

The server has robust error handling. Any uncaught exceptions are logged and a 500 response is returned.

## Data Validation

Data sent to the server is validated using the `express-validator` middleware. If the data does not meet the requirements, a 400 response is returned along with the validation errors.

## Contributing

Contributions are welcome! Please read our TODO[contributing guide](link to contributing guide) to get started.

## License

This project is licensed under the MIT License - see the TODO[LICENSE](link to license) file for details.

## Contact

If you have any questions or feedback, please reach out to me at joshxekhai@gmail.com
