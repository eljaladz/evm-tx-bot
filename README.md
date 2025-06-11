# EVM Tx Bot 🤖

[](https://opensource.org/licenses/MIT)
[](https://nodejs.org/)
[](https://ethers.io/)

A powerful and customizable command-line bot for automating native token transfers on Ethereum and other EVM-compatible networks. Perfect for managing multiple wallets, consolidating funds, or generating transaction activity for testnets.

*(A snapshot of the real-time dashboard in action)*

-----

## ✨ Features

  * **Multi-Network Support**: Works with any EVM network (e.g., Ethereum, Sepolia, BSC Testnet). Easily configurable in `src/network.js`.
  * **Run All Networks**: Use the `all` command to run the transaction process sequentially across every configured network.
  * **Flexible Wallet Management**: Load an unlimited number of wallets from a `.env` file using either **mnemonic phrases** or **private keys**.
  * **Smart Transfer Logic**:
      * **Round-Robin**: Automatically transfers funds from one wallet to the next in the list.
      * **Single Wallet Mode**: If only one wallet is provided, it sends funds to a new, randomly generated address for each transaction.
  * **Randomized Behavior**:
      * **Transaction Count**: Executes a random number of transactions per wallet within a configurable range.
      * **Transfer Amount**: Sends a random amount of tokens up to a specified maximum.
  * **Configurable Delays**: Set custom delays between individual transactions, between wallets, and between networks to avoid rate-limiting and appear more human.
  * **Interactive Dashboard**: A clean, real-time command-line interface shows the status of each wallet, current network, balances, and a running log of all activities.
  * **Block Explorer Links**: Automatically generates and logs direct links to the block explorer for each confirmed transaction, making verification a breeze.

## 🚀 Getting Started

Follow these steps to get the bot up and running on your local machine.

### Prerequisites

  * [Node.js](https://nodejs.org/en/) (version 18.x or higher is recommended)
  * `npm` (usually included with Node.js)

### Installation & Setup

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/eljaladz/evm-tx-bot.git
    ```

2.  **Navigate to the project directory:**

    ```bash
    cd evm-tx-bot
    ```

3.  **Install the necessary dependencies:**

    ```bash
    npm install
    ```

4.  **Create your environment file:**
    Rename the `env.example` file to `.env`.

    ```bash
    mv env.example .env; nano .env
    ```

5.  **Configure your wallets 📝:**
    Open the `.env` file and add your wallets. You can use any combination of `MNEMONIC_N` and `PRIVATE_KEY_N`.

    ```ini
    # .env - Example Configuration

    # Wallets from Mnemonic Phrases
    MNEMONIC_1="your twelve word seed phrase for the first wallet goes here"
    MNEMONIC_2="another twelve word seed phrase for the second wallet"

    # Wallets from Private Keys
    PRIVATE_KEY_3="0xYourPrivateKeyForTheThirdWallet"
    PRIVATE_KEY_4="0xAnotherPrivateKey"

    # You can add as many as you need, just increment the number.
    MNEMONIC_5="..."
    ```

    > **⚠️ Security Warning:** Your `.env` file contains sensitive information. Never commit it to a public repository. The `.gitignore` file is already configured to ignore it.

6.  **(Optional) Configure Networks:**
    To add or modify networks, edit the `src/network.js` file. The structure is simple:

    ```javascript
    export const networks = {
      sepolia: {
        rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
        chainName: "Sepolia",
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        blockExplorerUrl: "https://eth-sepolia.blockscout.com",
      },
      // Add your custom network here
      arbitrum: {
        rpcUrl: "https://arb1.arbitrum.io/rpc",
        chainName: "Arbitrum One",
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        blockExplorerUrl: "https://arbiscan.io",
      }
    };
    ```

## ⚙️ How to Run the Bot

Use the `npm start` command followed by arguments to run the bot.

### Command Structure

```bash
npm start -- [network_name|all] [max_amount] [max_random_tx]
```

  * `network_name|all`: The network to run on (e.g., `sepolia`) or `all` to run on every configured network.
  * `max_amount`: The maximum random amount of native currency to send per transaction (e.g., `0.01`).
  * `max_random_tx`: The upper limit for the random number of transactions each wallet will perform. The bot will execute between 5 (the static minimum) and this number.

### Usage Examples

**1. Run on a single network (Sepolia)**
This will make each wallet perform a random number of transactions (between 5 and 15), sending up to 0.01 ETH each time.

```bash
npm start -- sepolia 0.01 15
```

**2. Run across ALL configured networks**
The bot will run the full process on Sepolia, then pause for 30 seconds, then run the full process on BSC Testnet, and so on for all networks in `src/network.js`.

```bash
npm start -- all 0.005 8
```

**3. Using the minimum transaction override**
If you specify a max transaction count less than 5, the bot will default to the static minimum of 5. This command will result in each wallet performing exactly 5 transactions.

```bash
npm start -- sepolia 0.01 3
```

**4. Using default values**
If you only specify the network, amount and transaction count will default to `0.001` and `10` respectively.

```bash
npm start -- sepolia
```

## 📁 Project Structure

```
.
├── .env                  # Your secret keys and mnemonics (ignored by git)
├── .gitignore
├── README.md             # This file
├── index.js              # The main script with all the core logic
├── package.json
└── src
    ├── dashboard.js      # Manages the command-line interface and layout
    └── network.js        # Network configurations (RPC URLs, explorers, etc.)
```

## 🔒 **Security Notice**

⚠️ **Important:** Keep your credentials safe!  
Never share `.env` or `config.json` files with anyone. Treat these files like passwords.

---

## 🤝 **Contributing**

Need access to the source code? Feel free to drop me a DM!

---

## ⚠️ **Disclaimer**

This bot is provided **"as is"**, without any warranties.  
You're fully responsible for any actions taken using this tool. Understand the risks before proceeding.

---

## 📜 **License**

This project is licensed under the [MIT License](https://github.com/eljaladz/evm-tx-bot/blob/main/LICENSE).

---

## 💖 **Support & Donations**

If you would like to support the development of this project, you can make a donation using the following addresses:

- **TON**:
```
UQDoLQNF-nt9CFOHBs9mQqxH9YJKrZ6mFPbAeHH8Jo9xIGCb
```
- **EVM**:
```
0xfD1847bFAA92fb8c0d100b207d377490C5acd34c
```
- **SOL**:
```
BBZjp11sJNvekXZEBhhYDro9gsyyhEKXXcfEEub5ubje
```

---

## 🔥 **Join Our Community**

Let’s grow together! 🎉

- 📣 [![Telegram](https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Telegram_logo.svg/12px-Telegram_logo.svg.png)](https://t.me/NoDrops) [NoDrops Telegram Channel](https://t.me/NoDrops)
- 💬 [![Telegram](https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Telegram_logo.svg/12px-Telegram_logo.svg.png)](https://t.me/NoDropsChat) [NoDrops Telegram Group](https://t.me/NoDropsChat)