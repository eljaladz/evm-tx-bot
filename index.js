import "dotenv/config";
import { ethers } from "ethers";
import { networks } from "./src/network.js";
import { AccountManager, Dashboard } from "./src/dashboard.js";

const MIN_TRANSFER_WEI = ethers.parseEther("0.00001");
const DELAY_BETWEEN_TXS = 3000;
const DELAY_BETWEEN_WALLETS = 5000;
const DELAY_BETWEEN_NETWORKS = 5000;
const GAS_BUFFER_WEI = ethers.parseEther("0.0005");
const STATIC_MIN_TX = 5;

async function main() {
  const networkArg = process.argv[2];
  const maxAmountStr = process.argv[3] || "0.001";
  const userMaxTx = parseInt(process.argv[4], 10) || 10;

  let networksToProcess = [];
  if (!networkArg) {
    console.error(`\x1b[31mError: Network name not provided.\x1b[0m`);
    return;
  }
  
  if (networkArg.toLowerCase() === 'all') {
    networksToProcess = Object.keys(networks);
  } else if (networks[networkArg]) {
    networksToProcess = [networkArg];
  } else {
    console.error(`\x1b[31mError: Invalid network name '${networkArg}'.\x1b[0m`);
    console.log(`Usage: npm start -- [network_name | all] [max_amount] [max_random_tx_per_wallet]`);
    console.log(`Available networks: \x1b[32m${Object.keys(networks).join(", ")}\x1b[0m`);
    return;
  }
  
  const maxAmountWei = ethers.parseEther(maxAmountStr);
  const accountManager = new AccountManager();
  const dashboard = new Dashboard(accountManager);

  const wallets = [];
  let i = 1;
  while (true) {
    const mnemonic = process.env[`MNEMONIC_${i}`];
    const privateKey = process.env[`PRIVATE_KEY_${i}`];
    if (!mnemonic && !privateKey) break; 
    if (mnemonic) wallets.push(ethers.Wallet.fromPhrase(mnemonic));
    if (privateKey) wallets.push(new ethers.Wallet(privateKey));
    i++;
  }

  if (wallets.length === 0) {
    dashboard.addDebugMessage("[ERROR] No wallets found in .env file.");
    return;
  }
  global.PRIVATE_KEYS = wallets.map((w) => w.privateKey);

  let totalSuccessfulTx = 0;
  
  for (const [netIndex, networkName] of networksToProcess.entries()) {
    const selectedNetwork = networks[networkName];
    dashboard.setCurrentNetwork(selectedNetwork.chainName);
    dashboard.addDebugMessage(`[INFO] Starting process for network: ${selectedNetwork.chainName}`);

    const provider = new ethers.JsonRpcProvider(selectedNetwork.rpcUrl);
    const currencySymbol = selectedNetwork.nativeCurrency.symbol;
    const isSingleWallet = wallets.length === 1;

    for (let walletIndex = 0; walletIndex < wallets.length; walletIndex++) {
      const senderWallet = wallets[walletIndex].connect(provider);
      const senderAddress = senderWallet.address;
      dashboard.currentAccount = walletIndex;

      let txCountForThisWallet;
      if (userMaxTx < STATIC_MIN_TX) {
        txCountForThisWallet = STATIC_MIN_TX;
      } else {
        txCountForThisWallet = Math.floor(Math.random() * (userMaxTx - STATIC_MIN_TX + 1)) + STATIC_MIN_TX;
      }

      let recipientAddress;
      if (!isSingleWallet) {
        recipientAddress = wallets[(walletIndex + 1) % wallets.length].address;
      }

      dashboard.addDebugMessage(`[INFO] Processing Wallet ${walletIndex + 1}/${wallets.length} for ${txCountForThisWallet} txs.`);

      for (let txNum = 1; txNum <= txCountForThisWallet; txNum++) {
        try {
          if (isSingleWallet) {
            recipientAddress = ethers.Wallet.createRandom().address;
          }

          const balance = await provider.getBalance(senderAddress);
          accountManager.updateAccount(senderAddress, {
            balances: { [currencySymbol]: ethers.formatEther(balance) },
            status: `Running Tx ${txNum}/${txCountForThisWallet}`,
          });
          dashboard.renderDashboard();

          const availableToSend = balance - GAS_BUFFER_WEI;

          if (availableToSend > MIN_TRANSFER_WEI) {
            const effectiveMax = availableToSend < maxAmountWei ? availableToSend : maxAmountWei;
            const range = effectiveMax - MIN_TRANSFER_WEI;
            let amountToSendWei = range > 0n ? (ethers.toBigInt(ethers.randomBytes(32)) % range) + MIN_TRANSFER_WEI : MIN_TRANSFER_WEI;
            
            const tx = { to: recipientAddress, value: amountToSendWei };

            dashboard.addDebugMessage(`[INFO] Wallet ${walletIndex + 1} | Tx ${txNum}: Sending ${ethers.formatEther(amountToSendWei).substring(0, 8)} ${currencySymbol}...`);
            
            const transactionResponse = await senderWallet.sendTransaction(tx);
            const txHash = transactionResponse.hash;

            dashboard.addDebugMessage(`[INFO] Tx sent, waiting for confirmation...`);
            
            await transactionResponse.wait();
            
            dashboard.addDebugMessage(`[SUCCESS] Tx confirmed!`);
            
            if (selectedNetwork.blockExplorerUrl) {
              const explorerLink = `${selectedNetwork.blockExplorerUrl}/tx/${txHash}`;
              dashboard.addDebugMessage(`[INFO] View on Explorer: ${explorerLink}`);
            } else {
              dashboard.addDebugMessage(`[INFO] Tx Hash: ${txHash}`);
            }
            
            totalSuccessfulTx++;

            if (txNum < txCountForThisWallet) {
              dashboard.addDebugMessage(`[INFO] Waiting for next tx...`);
              await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_TXS));
            }

          } else {
            dashboard.addDebugMessage(`[WARN] Wallet ${walletIndex + 1}: Insufficient balance. Stopping its transactions.`);
            break; 
          }
        } catch (error) {
          dashboard.addDebugMessage(`[ERROR] Wallet ${walletIndex + 1} | Tx ${txNum}: Failed - ${error.message}`);
        }
      } 

      const finalBalance = await provider.getBalance(senderAddress);
      accountManager.updateAccount(senderAddress, {
        balances: { [currencySymbol]: ethers.formatEther(finalBalance) },
        status: "Process Complete",
      });
      dashboard.renderDashboard();

      if (walletIndex < wallets.length - 1) {
          dashboard.addDebugMessage(`[INFO] Waiting ${DELAY_BETWEEN_WALLETS/1000}s before processing next wallet...`);
          await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_WALLETS));
      }
    }

    if (netIndex < networksToProcess.length - 1) {
        const nextNetwork = networks[networksToProcess[netIndex + 1]].chainName;
        dashboard.addDebugMessage(`[INFO] Completed all wallets for ${selectedNetwork.chainName}. Next network (${nextNetwork}) starts in ${DELAY_BETWEEN_NETWORKS/1000}s.`);
        dashboard.startnextProcessTimer(DELAY_BETWEEN_NETWORKS / 1000);
        await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_NETWORKS));
    }
  }

  dashboard.addDebugMessage(`[INFO] Automation finished. Total successful transactions: ${totalSuccessfulTx}`);
}

main().catch((error) => {
  console.error("An unexpected error occurred:", error);
});