---
author: Edoardo Ierina
pubDatetime: 2024-12-06T00:47:00Z
title: Alloy in Action (Part 3) - Real-Time Event Monitoring and Stream Processing
featured: false
draft: false
tags:
  - Alloy
  - EVM
  - Rust
description:
  Dive deeper into blockchain development with the third installment of the "Alloy in Action" series. This post explores real-time event subscriptions using Rust and Alloy, guiding you through setting up event listeners, decoding event data, and implementing advanced filtering strategies. Learn how to build reactive applications that respond to on-chain events.
---

Welcome back to the "Alloy in Action" series! If you've been following along, you've already dipped your toes into deploying contracts and composing advanced transactions using Alloy in Rust. Now, it's time to dive into the deep end and explore the dynamic world of blockchain events. Ever wondered how decentralized applications (dApps) stay in sync with the ever-changing blockchain state? Today, we'll unlock that mystery by building real-time event-driven systems.

**Note:** The full code for this tutorial is available on GitHub: [eierina/alloy-in-action/03-real-time-event-subscriptions](https://github.com/eierina/alloy-in-action/tree/main/03-real-time-event-subscriptions).

This article assumes you're comfortable with Rust and have a basic understanding of Solidity. If you're just joining us, consider revisiting [Part 1](/posts/alloy-in-action/deploy-interact-decode/) and [Part 2](/posts/alloy-in-action/advanced-transaction-composition/) to get up to speed.

## The Power of Events in Blockchain

Blockchain events are like the unsung heroes of the decentralized world. They allow smart contracts to emit logs that external applications can listen to and act upon. Imagine events as the blockchain's way of saying, "Hey, something important just happened!"—and it's up to us to listen.

**Why are events crucial?**

- **Real-Time Updates:** They enable applications to respond instantly to changes.
- **Efficient Data Retrieval:** Instead of polling for state changes, we can react to events.
- **Decentralized Coordination:** Events facilitate communication between smart contracts and off-chain systems.

But how do we harness this power? Let's find out.

## Setting Up the Environment

Before we embark on this adventure, ensure you have the following set up:

- **Rust** installed. [Install Rust](https://www.rust-lang.org/tools/install).
- **Foundry toolchain** installed. [Install Foundry](https://book.getfoundry.sh/getting-started/installation).
  - **Anvil** running as our local Ethereum node simulator. Run `anvil --block-time=3` to simulate a realistic block time.
- **Solidity 0.8.24 compiler** installed. [Install solc](https://github.com/crytic/solc-select).

### Creating the Rust Project

Let's create a new Rust project and add the necessary dependencies:

```shell
mkdir alloy-in-action
cd alloy-in-action # Root folder

cargo new 03-real-time-event-subscriptions --bin --name real_time_event_subscriptions
cd 03-real-time-event-subscriptions # Rust project folder

cargo add alloy-chains@0.1.47 \
          alloy-network@0.7.2 \
          alloy-primitives@0.8.11 \
          alloy-provider@0.7.2 \
          alloy-rpc-types@0.7.2 \
          alloy-signers@0.7.2 \
          alloy-sol-macro@0.8.11 \
          alloy-sol-types@0.8.11 \
          dotenv@0.15.0 \
          eyre@0.6.12 \
          futures@0.3.31 \
          tokio@1.41.0 \
          tracing-subscriber@0.3.18 \
          url@2.5.3 \
          --features alloy-provider@0.7.2/ws,tokio@1.41.0/rt,tokio@1.41.0/rt-multi-thread,tokio@1.41.0/macros
```

### Setting Up Environment Variables

Create a `.env` file in the root folder with the following content:

```shell
# Private key for the first default Anvil account
ANVIL_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
# Private key for the second default Anvil account
ANVIL_SECONDARY_PRIVATE_KEY=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
# WebSocket URL for the Anvil local Ethereum node
ANVIL_WS_URL=ws://127.0.0.1:8545
# Default Chain ID for the Anvil network
ANVIL_CHAIN_ID=31337
```

### Setting Up the Solidity Project

In the root directory (`alloy-in-action`), create a new Solidity project:

```shell
forge init solidity-smart-contracts
cd solidity-smart-contracts # Solidity root folder
echo 'solidity = "0.8.24"' >> foundry.toml
forge install
```

Create a `SampleContract.sol` file in the `src` folder of the Solidity project with the following content:

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

## Declaring the Smart Contract Interface in Rust

Let's declare the external interface of our Solidity contract using the `sol!` macro. Replace the contents of `src/main.rs` with the following code:

```rust
use std::{io::stdin, path::Path, sync::Arc};
use eyre::Result;
use futures::StreamExt;
use url::Url;
use alloy_network::EthereumWallet;
use alloy_primitives::{Address, U256, utils::Unit};
use alloy_provider::{Provider, ProviderBuilder, WsConnect};
use alloy_rpc_types::{BlockNumberOrTag, Filter};
use alloy_signer_local::PrivateKeySigner;
use alloy_sol_macro::sol;
use alloy_sol_types::{SolEventInterface, SolEvent};
use crate::SampleContract::{EtherReceived, EtherWithdrawn, SampleContractEvents, ValueChanged};

sol! {
    // source/reference contract in solidity-smart-contracts/src/SampleContract.sol
    // bytecode via `solc SampleContract.sol --bin --via-ir --optimize --optimize-runs 1`
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

Replace the `<BYTECODE>` placeholder in your Rust code with the actual bytecode output generated by the `solc` compiler (see next section).

### Compiling the Solidity Contract

Open a terminal in the Solidity project folder and compile the contract:

```shell
solc src/SampleContract.sol --bin --via-ir --optimize --optimize-runs 1

======= src/SampleContract.sol:SampleContract =======
Binary:
608034604d57601f61024238819003918201601f19168301916001600160401b03831184841017605157808492602094604052833981010312604d57515f556040516101dc90816100668239f35b5f80fd5b634e487b7160e01b5f52604160045260245ffdfe6080806040526004361015610012575f80fd5b5f3560e01c90816312065fe01461018e5750806320965255146101375780633ccfd60b146101535780633fa4f2451461013757806355241077146100f457806357eca1a5146100a95763d0e30db014610069575f80fd5b5f3660031901126100a5577f1e57e3bb474320be3d2c77138f75b7c3941292d647f5f9634e33a8e94e0e069b60408051338152346020820152a1005b5f80fd5b346100a5575f3660031901126100a5576040516335fdd7ab60e21b815260206004820152601260248201527168656c6c6f2066726f6d207265766572742160701b6044820152606490fd5b346100a55760203660031901126100a5577f93fe6d397c74fdf1402a8b72e47b68512f0510d7b98a4bc4cbdf6ac7108b3c596020600435805f55604051908152a1005b346100a5575f3660031901126100a55760205f54604051908152f35b346100a5575f3660031901126100a5575f80808047818115610185575b3390f11561017a57005b6040513d5f823e3d90fd5b506108fc610170565b346100a5575f3660031901126100a557602090478152f3fea26469706673582212206f147fef9942d5bc4d46bb70de766fa699b9f8ee6dbc970d61eec1572c1a1e7c64736f6c634300081b0033
```

## Initializing the Asynchronous Runtime and Logging

Alloy operations are asynchronous, so we'll use `tokio` for the runtime. We also set up logging to help us debug and trace our application:

```rust
#[tokio::main]
async fn main() -> Result<()> {
    // Load environment variables
    let env_path =
        Path::new(env!("CARGO_MANIFEST_DIR"))
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

## Creating the Signers and the Provider

We need a signer to authorize transactions and a provider to interact with the network. In this example we also prepare a secondary signer that can be used later to demonstrate additional filtering using Event's indexed parameters.

```rust
// Initialize signers and wallet
let private_key = std::env::var("ANVIL_PRIVATE_KEY")?;
let secondary_private_key = std::env::var("ANVIL_SECONDARY_PRIVATE_KEY")?;
let signer: PrivateKeySigner = private_key.parse()?;
let secondary_signer: PrivateKeySigner = secondary_private_key.parse()?;
let signer_address = signer.address();
let secondary_signer_address = secondary_signer.address();
let wallet: EthereumWallet = EthereumWallet::from(signer);

// Set up provider using WebSocket
let ws_url = std::env::var("ANVIL_WS_URL")?;
let ws_url = Url::parse(&ws_url)?;
let provider = ProviderBuilder::new()
    .with_recommended_fillers()
    .wallet(wallet)
    .on_ws(WsConnect::new(ws_url)).await?;
```

The WebSocket connection provides a persistent connection, enabling us to subscribe to events and receive real-time updates, which isn't possible with HTTP.

## Deploying the Contract

Let's deploy our `SampleContract` with an initial value of 1:

```rust
// Deploy the contract with an initial value of 1
let initial_value = U256::from(1);
let mut contract = SampleContract::deploy(provider.clone(), initial_value).await?;
let contract_address: Address = *contract.address();
println!(
    "📦 Contract deployed at address {} with initial value: {}",
    &contract_address, initial_value
);
```

## Subscribing to Events

### Subscribing to a Specific Event

The `sol!` macro provides a useful high-level interface for easily registering event filters and handling events, making it both straightforward and efficient to work with contract-generated logs. For each event defined in the Solidity contract, the macro generates corresponding Rust filter functions and types. However, keep in mind that at the current stage of development, using these high level functions you cannot simultaneously match or filter multiple different events with a single subscription. In other words, you must create one subscription per event type, which sometimes you'll want to avoid.

Below is an example of subscribing to the `ValueChanged` event. In this case, we illustrate how to use the `updater` indexed parameter of the event to further restrict filtering to a specific updater address pair. While this might appear redundant when including both signer addresses (since omitting them would yield the same results), it serves as a valuable demonstration. By experimenting with the `address_filter` vector, you can observe how adjusting the filtering parameters affects the incoming event stream:

```rust
    // Set up event filters
let address_filter: Vec<B256> = vec![
    B256::left_padding_from(&signer_address.0.0),
    B256::left_padding_from(&secondary_signer_address.0.0)
];

// Create a filter for the ValueChanged event starting from the latest block
let value_changed_filter = contract
    .ValueChanged_filter()
    .topic1(address_filter.clone())
    .from_block(BlockNumberOrTag::Latest);

// Subscribe to the ValueChanged event logs
let value_changed_subscription = value_changed_filter.subscribe().await?;
println!("📡 Subscribed to ValueChanged events.");

```

When running this example with `RUST_LOG="alloy_rpc_client=trace" cargo run`, you may encounter console output similar to the following, showing how the filter is translated into the JSON RPC request:

```json
2024-12-05T14:18:06.172636Z TRACE alloy_rpc_client::call: serialized request request={
  "method": "eth_subscribe",
  "params": [
    "logs",
    {
      "fromBlock": "latest",
      "address": "0x5feaebfb4439f3516c74939a9d04e95afe82c4ae", // contract address
      "topics": [
        "0xe435f0fbe584e62b62f48f4016a57ef6c95e4c79f5babbe6ad3bb64f3281d261", // keccak256("ValueChanged(address,uint256,uint256)")
        [
          "0x00000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c8", // signer 2 address
          "0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266"  // signer 1 address
        ]
      ]
    }
  ],
  "id": 12,
  "jsonrpc": "2.0"
}
```

In this JSON snippet, you can see:

- The contract address under observation (`0x5feaebfb4439f3516c74939a9d04e95afe82c4ae`).
- The topic0 topic (`0xe435f0fbe584e62b62f48f4016a57ef6c95e4c79f5babbe6ad3bb64f3281d261`), which corresponds to the `ValueChanged` event signature hash (`keccak256("ValueChanged(address,uint256,uint256)")`).
- The topic1 topic, which contains the addresses we are filtering by, serving as the indexed `updater` parameter.

If you're curious, try to update the filter parameters and see how it affects the JSON RPC request and the events triggered by the transactions.

### Handling Incoming Events

Once you've subscribed to an event, you can convert the resulting subscription into a stream. This allows your application to process incoming events asynchronously as they occur, enabling real-time responses to blockchain activity.

In the example below, we create a new asynchronous task to listen for `ValueChanged` events. Also in this case, the `sol!` macro provides a convenient interface that automatically decodes event data into strongly typed Rust structures. Each event arrives both in its decoded and raw log form, enabling flexible processing. Here, we simply match on the decoded event and print its details to the console for immediate feedback on contract state changes:

```rust
// Convert the subscription into a stream for processing
let mut value_changed_stream = value_changed_subscription.into_stream();

// Spawn a task to handle incoming ValueChanged events
tokio::spawn(async move {
    println!("👂 Listening for ValueChanged events...");
    while let Some(result) = value_changed_stream.next().await {
        match result {
            Ok((event, log)) => {
                // Print details of the ValueChanged event
                println!(
                    "⚡️ |ValueChanged| - updater: {}, oldValue: {}, newValue: {} [{}]",
                    event.updater, event.oldValue, event.newValue, log.address()
                );
            }
            Err(e) => {
                eprintln!("⚠️ Error processing event: {:?}", e)
                // Handle error ...
            }
        }
    }
});
```

By utilizing this asynchronous pattern, an application can handle updates efficiently, even under high event throughput. The `sol!` macro-generated types ensure strongly typed, structured event data, simplifying the decoding process and making it easier to implement custom logic for each event encountered.

### Subscribing to Multiple Events

Earlier, we noted that the `sol!` macro offers a convenient high-level API but has certain limitations. One such constraint is the inability to subscribe to multiple distinct events through a single subscription when using the macro-generated interfaces directly. Fortunately, Alloy's RPC APIs provide a more flexible approach. By manually creating a filter that includes multiple event signatures, you can monitor various event types within a single subscription stream.

In the example below, we configure a filter that captures `ValueChanged`, `EtherReceived`, and `EtherWithdrawn` events from our deployed `SampleContract`. We again use the `address_filter` vector used earlier to demonstrate how indexed parameters can be leveraged, though you may find that omitting certain parameters still produces similar results. This approach is intentionally verbose, allowing you to experiment with different filter configurations and observe how each parameter affects the logs you receive:

```rust
// Create a combined filter for multiple events
let events_filter = Filter::new()
    .address(contract_address)
    .topic1(address_filter.clone())
    .event_signature(vec![

        ValueChanged::SIGNATURE_HASH,
        EtherReceived::SIGNATURE_HASH,
        EtherWithdrawn::SIGNATURE_HASH
    ])
    .from_block(BlockNumberOrTag::Latest);

// Subscribe to the combined events filter
let events_subscription = provider.subscribe_logs(&events_filter).await?;
println!("📡 Subscribed to combined events.");
```

In this example, we're set to receive notifications about all three `SampleContract` events when the first indexed event parameter matches one of the two signer addresses, starting from the latest block. Keep in mind:

- Redundancy: Certain parameters may be unnecessary. For example, specifying all three event signatures gives the same results as specifying none as in both cases we match all events (match 3 vs match all); specifying both signer addresses in `topic1` gives the same results as specifying none as in both cases we capture all the signers (match 2 vs match all). Try experimenting with subsets.
- Event Parameters: In this particular example, all three `SampleContract` events share a pattern where the first indexed parameter is always the `msg.sender` address of the transaction signer. This uniformity allows the `address_filter` vector to simultaneously apply to all three events. Real-world scenarios may be more diverse, potentially requiring multiple filters or subscriptions to capture all desired events efficiently.

When running this example with `RUST_LOG="alloy_rpc_client=trace" cargo run`, you may encounter console output similar to the following, showing how the filter is translated into the JSON RPC request:

```json
2024-12-05T22:15:15.363918Z TRACE alloy_rpc_client::call: serialized request request={
  "method": "eth_subscribe",
  "params": [
    "logs",
    {
      "fromBlock": "latest",
      "address": "0x870526b7973b56163a6997bb7c886f5e4ea53638", // contract address
      "topics": [
        [
          "0x1d57945c1033a96907a78f6e0ebf6a03815725dac25f33cc806558670344ac88", // keccak256("EtherReceived(address,uint256,uint256)")
          "0xe435f0fbe584e62b62f48f4016a57ef6c95e4c79f5babbe6ad3bb64f3281d261", // keccak256("ValueChanged(address,uint256,uint256)")
          "0xd5ca65e1ec4f4864fea7b9c5cb1ec3087a0dbf9c74641db3f6458edf445c4051"  // keccak256("EtherWithdrawn(address,uint256,uint256)")
        ],
        [
          "0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266", // signer 1 address
          "0x00000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c8"  // signer 2 address
        ]
      ]
    }
  ],
  "id": 10,
  "jsonrpc": "2.0"
}
```

This output confirms that our subscription request has been made with multiple event signatures and indexed filters in place, offering a powerful and flexible way to capture a broad range of event data from a single subscription and stream.

### Processing Multiple Event Types

After subscribing to multiple events, the next step is to process and handle them as they arrive. Similar to how we handled single-event streams, we can convert the combined subscription into a stream and spawn an asynchronous task to decode and respond to incoming events. Thanks to the strongly typed event structures generated by the `sol!` macro, processing each event type becomes straightforward and reliable.

Below is an example of how to process different event types within a single subscription:

```rust
// Convert the subscription into a stream for processing
let mut events_stream = events_subscription.into_stream();

// Spawn a task to listen and decode all contract events into their specific types
tokio::spawn(async move {
    println!("👂 Listening for events...");
    while let Some(log) = events_stream.next().await {
        // Decode the log into SampleContractEvents enum        
        match SampleContractEvents::decode_log(log.as_ref(), true) {
            Ok(event) => {
                match event.data {
                    SampleContractEvents::ValueChanged(e) => {
                        println!(
                            "⚡️ ValueChanged   - updater: {}, oldValue: {}, newValue: {} [{}] ",
                            e.updater, e.oldValue, e.newValue, log.address()
                        );
                    }
                    SampleContractEvents::EtherReceived(e) => {
                        println!(
                            "⚡️ EtherReceived  - sender: {}, amount: {}, newBalance: {} [{}]",
                            e.sender, e.amount, e.newBalance, log.address()
                        );
                    }
                    SampleContractEvents::EtherWithdrawn(e) => {
                        println!(
                            "⚡️ EtherWithdrawn - recipient: {}, amount: {}, remainingBalance: {} [{}]",
                            e.recipient, e.amount, e.remainingBalance, log.address()
                        );
                    }
                }
            }
            Err(_) => {
                eprintln!("⚠️ Unknown event received.")
                // Handle error ...
            }
        }
    }
});
```

This approach ensures your application remains responsive and adaptable, even when monitoring a wide range of event types simultaneously. As new logs arrive, each event is automatically decoded and directed to the appropriate handler, making it easier to maintain and scale your event-driven logic as your application grows in complexity.

## Triggering Events

With the event subscriptions and handlers established, it's time to put our real-time monitoring to the test. We'll begin by sending three consecutive transactions to the contract:

1. **Set the Contract Value:** Increment the contract's stored `value` to trigger a `ValueChanged` event.
2. **Deposit Ether:** Send a small amount of Ether (1 Pwei) to invoke the `EtherReceived` event.
3. **Withdraw Balance:** Withdraw the entire contract balance, emitting the `EtherWithdrawn` event.

After executing these three transactions with the initial signer, we'll switch the provider's default signer to the secondary signer and repeat the same sequence of three transactions. This approach allows us to observe event emission from both the primary and secondary signers in real-time. According to our plan, we expect to receive four events from each signer, as each transaction results in an event that our application can immediately detect and process.

```rust
for i in 0..2 {
    // 1. Set the contract value to (i + 1) to trigger the ValueChanged event
    println!("🔄 Sending transaction to set new value.");
    let new_value = U256::from(i + 2);
    let _ = contract.setValue(new_value).send().await?;

    // 2. Deposit 1 Pwei to the contract
    println!("🔄 Sending transaction to deposit Ether.");
    let _ = contract.deposit().value(Unit::PWEI.wei()).send().await?;

    // 3. Withdraw balance from the contract
    println!("🔄 Sending transaction to withdraw Ether.");
    let _ = contract.withdraw().send().await?;

    // Change the signer to the secondary signer
    provider.wallet_mut().register_default_signer(secondary_signer.clone());
    contract = SampleContract::new(contract_address, provider.clone());
}
```

> **Important:** It is generally not advisable to send multiple transactions consecutively without waiting for at least one confirmation in between.

Each of these transactions emits an event corresponding to the action performed, enabling us to verify that our event subscriptions and stream processing logic work as intended. As the transactions complete and the events are emitted, the application responds immediately, providing real-time feedback and insights into the contract's state.

## Keeping the Application Running

Since our event listeners are running asynchronously, we need to keep the main function alive:

```rust
// Keep the main function alive until all expected events are processed
println!("⏳ All transactions sent. Waiting for events. Press Enter to exit.");
stdin().read_line(&mut String::new())?;

Ok(())
```

## Running the Example

To successfully run the example, ensure that **Anvil** is operating locally with the `block time` option set to `3`. This configuration simulates the time interval between block generations, allowing you to observe transaction confirmations in a controlled environment.

### Steps to Run the Example

1. **Start Anvil Locally:**
   
   Begin by launching Anvil with the specified block time. Open your terminal and execute the following command:

   ```shell
   anvil --block-time 3
   ```

   This command initializes Anvil with a block time of 3 seconds, meaning a new block is mined every 3 seconds.

2. **Execute Your Code:**
   
   With Anvil running, execute the code we wrote so far. 
   
     ```shell
     cargo run
     ```

3. **Observe the Output:**
   
   As the code runs, you should see output similar to the example below. This output provides real-time feedback on the status of each transaction and the events received from the contract.

### Example Output
```
📦 Contract deployed at address 0xB2b580ce436E6F77A5713D80887e14788Ef49c9A with initial value: 1
📡 Subscribed to ValueChanged events.
👂 Listening for ValueChanged events...
📡 Subscribed to combined events.
🔄 Sending transaction to set new value.
👂 Listening for events...
🔄 Sending transaction to deposit Ether.
🔄 Sending transaction to withdraw Ether.
🔄 Sending transaction to set new value.
🔄 Sending transaction to deposit Ether.
🔄 Sending transaction to withdraw Ether.
⏳ All transactions sent. Waiting for events. Press Enter to exit.
⚡️ |ValueChanged| - updater: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266, oldValue: 1, newValue: 2 [0xB2b580ce436E6F77A5713D80887e14788Ef49c9A]
⚡️ |ValueChanged| - updater: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8, oldValue: 2, newValue: 3 [0xB2b580ce436E6F77A5713D80887e14788Ef49c9A]
⚡️ ValueChanged   - updater: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266, oldValue: 1, newValue: 2 [0xB2b580ce436E6F77A5713D80887e14788Ef49c9A] 
⚡️ EtherReceived  - sender: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266, amount: 1000000000000000, newBalance: 1000000000000000 [0xB2b580ce436E6F77A5713D80887e14788Ef49c9A]
⚡️ EtherWithdrawn - recipient: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266, amount: 1000000000000000, remainingBalance: 0 [0xB2b580ce436E6F77A5713D80887e14788Ef49c9A]
⚡️ ValueChanged   - updater: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8, oldValue: 2, newValue: 3 [0xB2b580ce436E6F77A5713D80887e14788Ef49c9A] 
⚡️ EtherReceived  - sender: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8, amount: 1000000000000000, newBalance: 1000000000000000 [0xB2b580ce436E6F77A5713D80887e14788Ef49c9A]
⚡️ EtherWithdrawn - recipient: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8, amount: 1000000000000000, remainingBalance: 0 [0xB2b580ce436E6F77A5713D80887e14788Ef49c9A]
```

## Conclusion

In this third installment of the "Alloy in Action" series, we've:

- Learned how to set up event listeners to receive instant updates from smart contracts, enabling applications to react promptly to on-chain activities.
- Implemented mechanisms to decode and interpret event logs, allowing for meaningful data extraction and utilization within your applications.
- Applied advanced filtering techniques to listen for specific events or event parameters, ensuring that your application processes only relevant data.
- Developed reactive systems that respond dynamically to blockchain events, enhancing the interactivity and responsiveness of decentralized applications.
- Explored strategies to optimize event processing performance, ensuring that your applications remain efficient even under high event throughput.  
