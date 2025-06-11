import figlet from "figlet";

export class AccountManager {
  constructor() {
    this.accountStats = new Map();
  }

  updateAccount(address, stats) {
    this.accountStats.set(address, stats);
  }

  getAccount(address) {
    return this.accountStats.get(address);
  }

  getAllAccounts() {
    return [...this.accountStats.entries()];
  }
}

export class Dashboard {
  constructor(accountManager, config = {}) {
    this.accountManager = accountManager;
    this.colors = config.dashboard?.colors || {
      reset: "\x1b[0m",
      success: "\x1b[32m",
      error: "\x1b[31m",
      info: "\x1b[36m",
      taskInProgress: "\x1b[33m",
      accountName: "\x1b[1;37m",
      menuTitle: "\x1b[1;36m",
      menuOption: "\x1b[36m",
      header: "\x1b[1;37m",
      headerText: "\x1b[1;34m",
    };
    this.refreshInterval = config.dashboard?.refreshInterval || 5000;
    this.lastRender = 0;
    this.renderTimeout = null;
    this.debugMessages = [];
    this.transactionLogs = [];
    this.currentAccount = 0;
    this.totalAccounts = 0;
    this.nextProcess = "~";
    this.currentNetwork = "";
  }

  addDebugMessage(message) {
    const { colors } = this;
    let coloredMessage;
    if (message.includes("[SUCCESS]")) {
      coloredMessage = message.replace(
        "[SUCCESS]",
        `${colors.success}[SUCCESS]${colors.reset}`
      );
    } else if (message.includes("[ERROR]")) {
      coloredMessage = message.replace(
        "[ERROR]",
        `${colors.error}[ERROR]${colors.reset}`
      );
    } else if (message.includes("[WARN]")) {
      coloredMessage = message.replace(
        "[WARN]",
        `${colors.taskInProgress}[WARN]${colors.reset}`
      );
    } else if (message.includes("[INFO]")) {
      coloredMessage = message.replace(
        "[INFO]",
        `${colors.info}[INFO]${colors.reset}`
      );
    } else {
      coloredMessage = message;
    }

    let finalMessage = coloredMessage;
    if (!finalMessage.includes("https://") && finalMessage.length > 98) {
      finalMessage = finalMessage.substring(0, 148);
    }

    this.debugMessages.push(`${finalMessage}${colors.reset}`);
    if (this.debugMessages.length > 10) {
      this.debugMessages.shift();
    }
    this.renderDashboard();
  }

  addTransactionLog(message) {
    const { colors } = this;
    this.transactionLogs.push(`${message}${colors.reset}`);
    if (this.transactionLogs.length > 5) {
      this.transactionLogs.shift();
    }
    this.renderDashboard();
  }

  getStatusColor(status) {
    const { colors } = this;
    switch (status) {
      case "Active":
      case "Running":
      case "Process Complete":
        return colors.success;
      case "Error":
      case "Transaction Failed":
      case "Connection Error":
        return colors.error;
      case "Starting":
      case "Authenticating":
      case "Fetching..":
      case "Claiming Points":
      case "Claiming Faucet":
      case "Swapping Tokens":
      case "Staking Tokens":
      case "Adding Liquidity":
      case "Processing Transaction":
        return colors.taskInProgress;
      case "Rate Limit Reached":
        return colors.error;
      case "No Data":
        return colors.info;
      default:
        return status.startsWith("Running Tx") ? colors.taskInProgress : colors.reset;
    }
  }

  getBanner() {
    let banner = "";
    try {
      banner = figlet.textSync("  NoDrops - Tx Bot", {
        font: "Slant",
        horizontalLayout: "default",
        verticalLayout: "default",
        width: 150,
      });
    } catch (err) {
      banner = "NoDrops";
      console.error("Figlet error:", err.message);
    }
    const { colors } = this;
    let output = [];
    output.push(`${colors.headerText}${banner}${colors.reset}`);
    output.push('');
    output.push(
      `${colors.headerText}Telegram: https://t.me/NoDrops\t\t\t\t${colors.headerText}GitHub: https://github.com/itsnodrops${colors.reset}`
    );
    output.push(
      ``
    );
    output.push("");
    return output.join("\n");
  }

  formatDate() {
    const now = new Date();
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const month = months[now.getMonth()];
    const day = now.getDate();
    let hours = now.getHours();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutes = now.getMinutes().toString().padStart(2, "0");
    return `${month}, ${day} - ${hours}:${minutes} ${ampm}`;
  }

  truncateAddress(address) {
    if (!address || address.length < 15) return address || "Loading Info...";
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  }

  renderDashboard() {
    const now = Date.now();
    if (now - this.lastRender < this.refreshInterval) {
      if (this.renderTimeout) {
        clearTimeout(this.renderTimeout);
      }
      this.renderTimeout = setTimeout(() => {
        this.actualRender();
      }, this.refreshInterval);
      return;
    }
    this.actualRender();
  }

  startnextProcessTimer(seconds) {
    if (this._networkTimer) {
      clearInterval(this._networkTimer);
    }
    let remainingSeconds = seconds;
    this.updatenextProcessTimer(remainingSeconds);
    this._networkTimer = setInterval(() => {
      remainingSeconds--;
      if (remainingSeconds <= 0) {
        clearInterval(this._networkTimer);
        this.nextProcess = "~";
      } else {
        this.updatenextProcessTimer(remainingSeconds);
      }
      this.renderDashboard();
    }, 1000);
  }

  setCurrentNetwork(network) {
    this.currentNetwork = network;
    this.renderDashboard();
  }

  updatenextProcessTimer(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    this.nextProcess = `${minutes}m ${remainingSeconds}s`;
  }

  actualRender() {
    this.lastRender = Date.now();
    let output = [];
    const { colors } = this;
    const accounts = [...this.accountManager.accountStats.entries()];

    if (global.PRIVATE_KEYS && global.PRIVATE_KEYS.length > 0) {
        this.totalAccounts = global.PRIVATE_KEYS.length;
      } else {
        let count = 0;
        for (let i = 1; i <= 100; i++) {
          if (process.env[`PRIVATE_KEY_${i}`] || process.env[`MNEMONIC_${i}`]) {
            count++;
          }
        }
        this.totalAccounts = count;
      }
  
      const hasWalletsInEnv = this.totalAccounts > 0;
  
      if (accounts.length === 0 && !hasWalletsInEnv) {
        output.push(
          `${colors.error}No accounts loaded. Please check your .env file.${colors.reset}`
        );
        console.log(output.join("\n"));
        return;
      }
  
      if (accounts.length === 0 && hasWalletsInEnv) {
        output.push("\x1b[2J\x1b[H");
        output.push(this.getBanner());
        output.push(
          `${colors.info}Loading accounts... Please wait.${colors.reset}`
        );
        console.log(output.join("\n"));
        return;
      }

    const [walletAddress, stats] = accounts[this.currentAccount] || accounts[0];
    output.push("\x1b[2J\x1b[H");
    output.push(this.getBanner());

    const accountPart = `${colors.header}Account ${this.currentAccount + 1}/${this.totalAccounts} - ${this.formatDate()}${colors.reset}`;
    const statusText = stats?.status || "Running";
    let statusPart = `${colors.header}Status: ${this.getStatusColor(statusText)}${statusText}${colors.reset}`;
    if (this.nextProcess !== "~" && statusText === "Process Complete") {
        statusPart += ` ${colors.info}(Next in: ${this.nextProcess})${colors.reset}`;
    }
    output.push(`${accountPart}\t\t\t${statusPart}`);

    const walletPart = `${colors.info}Wallet Address: ${colors.accountName}${this.truncateAddress(walletAddress)}${colors.reset}`;
    const networkPart = `${colors.header}Network: ${colors.info}${this.currentNetwork || "N/A"}${colors.reset}`;
    output.push(`${walletPart}\t\t\t\t${networkPart}`);

    if (stats && stats.balances) {
      Object.entries(stats.balances).forEach(([token, balance]) => {
        output.push(
          `${colors.info}${token} Balance : ${colors.taskInProgress}${balance}${colors.reset}`
        );
      });
    } else {
      output.push(
        `${colors.info}Balances    : ${colors.taskInProgress}Loading...${colors.reset}`
      );
    }
    output.push("");

    output.push(`${colors.header} Logs:${colors.reset}`);

    if (this.debugMessages.length > 0) {
      this.debugMessages.forEach((msg) => {
        output.push(msg);
      });
    } else {
      output.push("");
    }
    console.log(output.join("\n"));
  }

  switchToNextAccount() {
    this.currentAccount = (this.currentAccount + 1) % this.totalAccounts;
    this.renderDashboard();
  }
}