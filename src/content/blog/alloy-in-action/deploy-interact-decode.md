---
author: Edoardo Ierina
pubDatetime: 2024-10-28T15:20:35Z
title: Alloy in Action (Part 1) - Connect, Deploy, Interact, Decode
featured: false
draft: false
tags:
  - Alloy
  - EVM
  - Rust
description: Discover how to use Alloy, a powerful Rust library, for blockchain development in the first installment of the Alloy in Action series. This blog post guides you through setting up the development environment with Rust, Foundry, and Solidity, and walks you through creating both Rust and Solidity projects. Learn to deploy smart contracts using Alloy's sol! macro, interact with contracts, handle transactions and receipts, decode events, manage Ether transfers, and implement comprehensive error handling.
---

Welcome to the first post in the "Alloy in Action" series! Today, we'll explore how to use [Alloy](https://github.com/alloy-rs/alloy) - a powerful Rust library for blockchain development. This series aims to introduce you to the basics of connecting Rust applications to the blockchain, deploying and interacting with smart contracts, and decoding events and errors.

**Note:** The full code for this tutorial is available on GitHub: [eierina/alloy-in-action/01-deploy-interact-decode](https://github.com/eierina/alloy-in-action/tree/main/01-deploy-interact-decode).

This tutorial assumes a basic understanding of Solidity and Rust. If you're new to Rust, consider this an opportunity to learn by doing, as we'll introduce concepts incrementally and with increasing complexity.

## Setting Up the Environment

Before diving into the code, ensure you have the following set up:

- **Rust** installed on your machine (or click [here](https://www.rust-lang.org/tools/install) for install instructions).
- **Foundry toolchain** installed on your machine (or click [here](https://book.getfoundry.sh/getting-started/installation) for install instructions)
  - [Anvil](https://book.getfoundry.sh/anvil/) running as our local Ethereum node simulator with default options (just run `anvil` on the command line and you'll have a local testnet on [http://127.0.0.1:8545](http://127.0.0.1:8545)).
- **Solidity 0.8.24 compiler** installed on your machine (or click [here](https://github.com/crytic/solc-select) for instructions on how to install `solc-select`)

Create a new Rust project with the required dependencies and features:

```shell
mkdir alloy-in-action
cd alloy-in-action # root folder

cargo new 01-deploy-interact-decode --bin --name deploy_interact_decode
cd 01-deploy-interact-decode # Rust project folder

cargo add alloy-contract@0.5.4 \
          alloy-network@0.5.4 \
          alloy-primitives@0.8.9 \
          alloy-provider@0.5.4 \
          alloy-signer-local@0.5.4 \
          alloy-sol-macro@0.8.9 \
          alloy-sol-types@0.8.9 \
          alloy-transport@0.5.4 \
          dotenv@0.15.0 \
          eyre@0.6.12 \
          tokio@1.41.0 \
          tracing-subscriber@0.3.18 \
          url@2.5.2 \
          --features tokio@1.41.0/rt,tokio@1.41.0/rt-multi-thread,tokio@1.41.0/macros
```

Create a `.env` file in the root folder with the following variables:

```shell
# Private key for the first default Anvil account
ANVIL_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
# RPC URL for the Anvil local Ethereum node
ANVIL_RPC_URL=http://127.0.0.1:8545
# Default chain ID for the Anvil network
ANVIL_CHAIN_ID=31337
```

In the root directory (`alloy-in-action`), create a new Solidity project:

```shell
forge init solidity-smart-contracts
cd solidity-smart-contracts # Solidity root folder
echo 'solidity = "0.8.24"' >> foundry.toml
forge install
```

Create a `SampleContract.sol` file in the `src` folder of the Solidity root folder with the following content:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SampleContract {
    // State variable to store a single unsigned integer value
    uint256 public value;

    // Event to be emitted when the 'value' state variable is updated
    event ValueChanged(address indexed updater, uint256 indexed oldValue, uint256 newValue);

    // Event to be emitted when Ether is received via the deposit function
    event EtherReceived(address indexed sender, uint256 amount, uint256 newBalance);

    // Event to be emitted when Ether is withdrawn via the withdraw function
    event EtherWithdrawn(address indexed recipient, uint256 amount, uint256 remainingBalance);

    // Custom error used to demonstrate Solidity's revert mechanism
    error SampleError(string cause);

    /// @notice Constructor to set the initial value of the contract
    /// @param _initialValue The initial value assigned to 'value'
    constructor(uint256 _initialValue) {
        value = _initialValue;
    }

    /// @notice Sets a new value for the 'value' state variable
    /// @param _value The new value to be set
    function setValue(uint256 _value) external {
        uint256 oldValue = value;
        value = _value;
        emit ValueChanged(msg.sender, oldValue, _value);
    }

    /// @notice Retrieves the current value of the 'value' state variable
    /// @return currentValue The current value stored in 'value'
    function getValue() external view returns (uint256 currentValue) {
        currentValue = value;
    }

    /// @notice Accepts Ether deposits and logs the sender and amount
    function deposit() external payable {
        emit EtherReceived(msg.sender, msg.value, address(this).balance);
    }

    /// @notice Withdraws the entire balance of the contract to the caller
    function withdraw() external {
        uint256 balance = address(this).balance;
        payable(msg.sender).transfer(balance);
        emit EtherWithdrawn(msg.sender, balance, 0);
    }

    /// @notice Retrieves the contract's current Ether balance
    /// @return balance The current balance of the contract in wei
    function getBalance() external view returns (uint256 balance) {
        balance = address(this).balance;
    }

    /// @notice Reverts the transaction with a custom error message
    /// @dev Used to demonstrate custom error handling in Solidity
    function revertWithError() external pure {
        revert SampleError("hello from revert!");
    }
}
```

## Declaring the External Smart Contract Interface

The `sol!` macro enables defining Solidity contracts' ABI directly within Rust. This macro generates Rust types and functions that facilitate interaction with the contract. It can be used at the global scope or even inlined within functions. While it allows defining individual functions or types, defining the entire contract with its types and functions brings additional benefits in our example.

Two attributes are used in this example:

- **`rpc` attribute**: Generates Rust functions corresponding to the contract's functions.
- **`bytecode` attribute**: Includes the contract's compiled bytecode for deployment.

Replace the contents of the `src/main.rs` file in the Rust project folder with the following code:

```rust
use std::path::Path;
use alloy_contract::Error;
use alloy_network::EthereumWallet;
use alloy_primitives::{utils, U256};
use alloy_provider::{Provider, ProviderBuilder};
use alloy_signer_local::PrivateKeySigner;
use alloy_sol_macro::sol;
use alloy_sol_types::SolEventInterface;
use utils::format_ether;
use eyre::Result;
use url::Url;
use crate::SampleContract::SampleContractErrors;
use crate::SampleContract::SampleContractEvents;

sol! {
    #[sol(rpc, bytecode = "<BYTECODE>")]
    contract SampleContract {
        // Events
        event ValueChanged(address indexed updater, uint256 indexed oldValue, uint256 newValue);
        event EtherReceived(address indexed sender, uint256 amount, uint256 newBalance);
        event EtherWithdrawn(address indexed recipient, uint256 amount, uint256 remainingBalance);

        // Errors
        error SampleError(string cause);

        // Constructor
        constructor(uint256 _initialValue);

        // Functions
        /// @notice Sets a new value for the 'value' state variable
        /// @param _value The new value to be set
        function setValue(uint256 _value) external;

        /// @notice Retrieves the current value of the 'value' state variable
        /// @return currentValue The current value stored in 'value'
        function getValue() external view returns (uint256 currentValue);

        /// @notice Accepts Ether deposits and logs the sender and amount
        function deposit() external payable;

        /// @notice Withdraws the entire balance of the contract to the caller
        function withdraw() external;

        /// @notice Retrieves the contract's current Ether balance
        /// @return balance The current balance of the contract in wei
        function getBalance() external view returns (uint256 balance);

        /// @notice Reverts the transaction with a custom error message
        /// @dev Used to demonstrate custom error handling in Solidity
        function revertWithError() external pure;
    }
}

// Rest of the code ...
```

**Note:** Replace the `<BYTECODE>` placeholder with the actual bytecode generated by the Solidity compiler in the next step.

Open a terminal in the Solidity project folder and replace the `<BYTECODE>` placeholder in the code above with the following bytecode generated by the `solc` compiler:

```shell
solc src/SampleContract.sol --bin --via-ir --optimize --optimize-runs 1

======= src/SampleContract.sol:SampleContract =======
Binary:
608034604d57601f61028038819003918201601f19168301916001600160401b03831184841017605157808492602094604052833981010312604d57515f5560405161021a90816100668239f35b5f80fd5b634e487b7160e01b5f52604160045260245ffdfe6080806040526004361015610012575f80fd5b5f3560e01c90816312065fe0146101cc5750806320965255146101405780633ccfd60b1461015c5780633fa4f2451461014057806355241077146100f857806357eca1a5146100ad5763d0e30db014610069575f80fd5b5f3660031901126100a957476040519034825260208201527f1d57945c1033a96907a78f6e0ebf6a03815725dac25f33cc806558670344ac8860403392a2005b5f80fd5b346100a9575f3660031901126100a9576040516335fdd7ab60e21b815260206004820152601260248201527168656c6c6f2066726f6d207265766572742160701b6044820152606490fd5b346100a95760203660031901126100a9576004355f5490805f556040519081527fe435f0fbe584e62b62f48f4016a57ef6c95e4c79f5babbe6ad3bb64f3281d26160203392a3005b346100a9575f3660031901126100a95760205f54604051908152f35b346100a9575f3660031901126100a95747805f81156101c3575b5f80809381933390f1156101b8576040519081525f60208201527fd5ca65e1ec4f4864fea7b9c5cb1ec3087a0dbf9c74641db3f6458edf445c405160403392a2005b6040513d5f823e3d90fd5b506108fc610176565b346100a9575f3660031901126100a957602090478152f3fea2646970667358221220cae439afc02e7259cc99c579d322222052f82f79b377ffd437d0523157cb795f64736f6c634300081b0033
```

## Async Execution and Logging

Alloy is asynchronous, so we'll use `tokio` for async execution. We also set up logging to inspect Alloy's internal operations.

```rust
#[tokio::main]
async fn main() -> Result<()> {
    // Load .env file
    let env_path = Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .join(".env");
    dotenv::from_path(env_path).ok();

    // Initialize tracing subscriber for logging
    tracing_subscriber::fmt::init();

    // Rest of the code...

    Ok(())
}
```

### Loading Environment Variables

We use the `dotenv` crate to load environment variables from the `.env` file.

### Setting Up Tracing

We initialize the tracing subscriber to enable logging, which helps us inspect Alloy logs by running the application with `RUST_LOG=info/warn/debug/trace cargo run`.

## Creating a Local Signer

To interact with the blockchain, we need a signer. Alloy offers various signer providers, but we'll use the `PrivateKeySigner` for this example, which takes a K-256 Private Key as input. We're using the first default Anvil account, which comes with a balance of 10k Ether we'll use for paying gas and testing transfers.

```rust
// Create signer and wallet
let private_key = std::env::var("ANVIL_PRIVATE_KEY")?;
let signer: PrivateKeySigner = private_key.parse()?;
let signer_address = signer.address();
let wallet = EthereumWallet::from(signer);
```

**Signer Providers Available:**

- **Local Signers:** `PrivateKeySigner`, `MnemonicSigner`
- **Hardware Wallets:** Ledger, Trezor
- **Cloud-Based:** Amazon AWS' KMS, Google Cloud Platform's KMS
- **Hardware Security Module:** YubiHSM2

## Connecting to the Network

We create a provider to connect to the Ethereum-like network (an Anvil local testnet in this case).

```rust
// Set up provider
let rpc_url = std::env::var("ANVIL_RPC_URL")?;
let rpc_url = Url::parse(&rpc_url)?;
let provider = ProviderBuilder::new()
    .with_recommended_fillers() // Gas estimation, nonce management, chain ID fetching
    .wallet(wallet)
    .on_http(rpc_url);
```

`ProviderBuilder` allows us to add useful middleware:

- The `with_recommended_fillers()` adds essential middleware for gas estimation, nonce management, and chain ID fetching.
- The `wallet(...)` adds a wallet layer for signing the transactions.

**Note:** Alloy also supports WebSocket (`on_ws`) and IPC (`on_ipc`) providers.

### Choosing the Right Transport

- **HTTP:** Good for simple requests, less overhead.
- **WebSocket:** Ideal for subscriptions and real-time data.
- **IPC:** Best performance but limited to local nodes.

## Deploying the Contract

We deploy the contract using the `deploy` method generated by the `sol!` macro. This method utilizes the `bytecode` provided in the `sol!` macro and takes a reference to the provider and the contract constructor parameters as input.

```rust
// Deploy the contract with an initial value of 1
let initial_value = U256::from(1);
let contract = SampleContract::deploy(&provider, initial_value).await?;
println!("📦 Contract deployed with initial value: {}", initial_value);
```

### How It Works

- The `deploy` function constructs a deployment transaction using the contract's bytecode and the contract initialization parameters.
- The `rpc` attribute in the `sol!` macro enables this functionality.
- The transaction modifies the blockchain state by deploying the contract and returning the deployment address.

**Note:** While we're deploying the contract for completeness of this example, keep in mind that you can just connect a contract instance to an existing deployment address with the following line of code.

```rust
let contract = SampleContract::new(deployment_address, &provider);
```

## Interacting with the Contract

### Reading Contract State

We retrieve the initial value stored in the contract using the `call()` method.

```rust
// Retrieve the initial value from the contract
let current_value = contract.getValue().call().await?.currentValue;
println!("🔍 Initial value retrieved from contract: {}", current_value);
```

- The `call()` method sends an `eth_call` to the network, which is a read-only operation.
- It doesn't consume gas and doesn't modify the blockchain state.

### Updating Contract State

We update the contract's state by setting a new value.

```rust
// Set the contract value to 2
let new_value = U256::from(2);
let tx_builder = contract.setValue(new_value).send().await?;
let pending_tx = tx_builder.register().await?;
let tx_hash = pending_tx.await?;
println!("🔄 Transaction sent to set new value. Transaction hash: {:#x}", tx_hash);
```

- We use the `send()` method to create a transaction that modifies the blockchain state.
- The transaction is broadcasted to the network, and we wait for its inclusion in a block.

### Stages of Sending a Transaction

1. **Construction:** Building the transaction with necessary parameters.
2. **Signing:** Using the signer to sign the transaction.
3. **Broadcasting:** Sending the transaction to the network.
4. **Confirmation:** Waiting for the transaction to be mined and included in a block.

## Handling Transactions and Receipts

After sending a transaction, we can retrieve its receipt and decode logs.

```rust
// Get the transaction receipt
let receipt = provider
    .get_transaction_receipt(tx_hash)
    .await?
    .expect("Transaction receipt not found");
println!("🧾 Transaction receipt obtained. Receipt hash: {:#x}", receipt.transaction_hash);
```

- The receipt contains information about the transaction's execution, including events emitted.

## Decoding Events

After sending a transaction, we obtain a receipt and decode the emitted events. Here, we decode the `ValueChanged` event:

```rust
// Iterate over each log present in the transaction receipt
for log in receipt.inner.logs() {
    // Attempt to decode the current log into a SampleContractEvents instance
    if let Ok(log) = SampleContractEvents::decode_log(log.as_ref(), true) {
        // Check if the decoded event is of the `ValueChanged` variant
        if let SampleContractEvents::ValueChanged(event) = log.data {
            // Handle the `ValueChanged` event by printing the new value
            println!(
                "⚡️ Event: ValueChanged - \
                updater: {}, \
                oldValue: {}, \
                newValue: {}",
                event.updater, event.oldValue, event.newValue
            );
        }
    }
}
```

- The `sol!` macro generates an `Events` enum from the Solidity event declarations that we can use to match and handle different events.

## Working with Ether Transfers

We interact with the contract's payable functions to transfer Ether by setting the Ether value to be sent with the transaction before sending the transaction to the SampleContract's payable `deposit` function. Handling the receipt, the logs, and decoding the event is the same as previously seen.

```rust
// Deposit 1 Milli-Ether to the contract
let deposit_amount = U256::from(1_000_000_000_000_000u64);
let tx_builder = contract.deposit().value(deposit_amount).send().await?;
let pending_tx = tx_builder.register().await?;
let tx_hash = pending_tx.await?;
println!("🔄 Transaction sent to deposit Ether. Transaction hash: {:#x}", tx_hash);

// Get the transaction receipt
let receipt = provider
    .get_transaction_receipt(tx_hash)
    .await?
    .expect("Transaction receipt not found");
println!("🧾 Transaction receipt obtained. Receipt hash: {:#x}", receipt.transaction_hash);

// Iterate over each log present in the transaction receipt
for log in receipt.inner.logs() {
    // Attempt to decode the current log into a SampleContractEvents instance
    if let Ok(log) = SampleContractEvents::decode_log(log.as_ref(), true) {
        // Check if the decoded event is of the `EtherReceived` variant
        if let SampleContractEvents::EtherReceived(event) = log.data {
            // Handle the `EtherReceived` event by printing the sender and amount
            println!(
                "⚡️ Event: EtherReceived - \
                sender: {}; \
                amount: {} Ξ, \
                newBalance: {} Ξ",
                event.sender, format_ether(event.amount), format_ether(event.newBalance)
            );
        }
    }
}
```

## Handling Custom Errors

Finally, let's explore error handling by calling a function that deliberately reverts with an error. This is useful to understand how to decode and manage errors using the generated types.

```rust
// Trigger a revert with a custom error
match contract.revertWithError().call().await {
    Ok(_) => {
        // Handle successful call if necessary
    }
    Err(Error::TransportError(transport_error)) => {
        // Decode the error into SampleContractErrors
        match transport_error
            .as_error_resp()
            .and_then(|error| error.as_decoded_error::<SampleContractErrors>(true))
        {
            Some(SampleContractErrors::SampleError(sample_error)) => {
                println!("⚠️ Call reverted with SampleError: {:?}", sample_error.message);
            },
            // Other SampleContractErrors variants would be added here.
            _ => {
                println!("⚠️ Call reverted with unexpected transport error: {:?}", transport_error);
            }
        }
    }
    Err(error) => {
        // Handle other error variants
        println!("⚠️ Call reverted with unexpected error: {:?}", error);
    }
}
```

**Explanation:**

1. **Successful Call (`Ok(_)`):** If the contract call succeeds, you can handle the successful outcome as needed.
2. **Transport Errors (`Err(Error::TransportError)`):** These are errors from the transport layer. We attempt to decode them into our contract-specific errors (`SampleContractErrors`). If successful, we handle the `SampleError`. Otherwise, we log unexpected transport errors.
3. **Other Errors (`Err(error)`):** Handles any other types of errors that don't fall under `TransportError`, ensuring that all potential errors are accounted for.

Proper error handling ensures that your application can gracefully manage and respond to different failure scenarios, enhancing reliability and user experience.

## Running the Example

With Anvil running locally, you should see output like this:

```shell
📦 Contract deployed with initial value: 1
🔍 Initial value retrieved from contract: 1
🔄 Transaction sent to set new value. Transaction hash: 0x2b9133f299ae7ecf61fd29d7972186a9cf4fbdcf44026e9870c1f63342140a58
🧾 Transaction receipt obtained. Receipt hash: 0x2b9133f299ae7ecf61fd29d7972186a9cf4fbdcf44026e9870c1f63342140a58
⚡️ Event: ValueChanged - updater: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266, oldValue: 1, newValue: 2
🔍 Updated value retrieved from contract: 2
🔍 Initial contract balance: 0.000000000000000000 Ξ
🔍 Initial signer balance: 9999.999782077810858145 Ξ
🔄 Transaction sent to deposit Ether. Transaction hash: 0x52594caf0e64a3d48619f1bf234219816ead6a637ae6f7225912d59e96837f8c
🧾 Transaction receipt obtained. Receipt hash: 0x52594caf0e64a3d48619f1bf234219816ead6a637ae6f7225912d59e96837f8c
⚡️ Event: EtherReceived - sender: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266; amount: 0.001000000000000000 Ξ, newBalance: 0.001000000000000000 Ξ
🔍 Contract balance after deposit: 0.001000000000000000 Ξ
🔍 Signer balance after deposit: 9999.998764432830121729 Ξ
⚠️ Call reverted with SampleError: "hello from revert!"
```

### With Debug Logging

We've mentioned at the beginning of this post that we initialize the tracing subscriber for logging.

Below are a couple of options for you to try and run the application with debug logs to inspect the internal workings.

```shell
RUST_LOG="alloy_rpc_client=debug" cargo run
```

```shell
RUST_LOG="alloy_rpc_client=trace" cargo run
```

These commands enable different levels of logging verbosity, allowing you to gain deeper insights into Alloy's operations during execution.

## Conclusion

In this tutorial, we've:

- Set up a Rust application using Alloy to interact with the Ethereum blockchain.
- Used the `sol!` macro to define and interact with a Solidity contract.
- Deployed a contract, interacted with it, and handled events and errors.
- Learned about the different components of Alloy and how they fit together.

## What's Next?

This post introduced the basics of using Alloy to interact with Ethereum networks. In upcoming posts, we'll explore:

- Nonce management
- Handling gas estimation
- Handling Chain ID for replay attack prevention
- Transaction confirmation and timeout strategies
- WebSocket and IPC providers
- Registering and filtering blockchain events
