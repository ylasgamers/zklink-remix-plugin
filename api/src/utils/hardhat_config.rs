use crate::utils::lib::{DEFAULT_SOLIDITY_VERSION, DEFAULT_ZKSOLC_VERSION};
use rocket::serde::json::serde_json;

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct HardhatConfig {
    pub zksolc: ZksolcConfig,
    pub solidity: SolidityConfig,
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug, Default)]
pub struct ZksolcConfig {
    pub version: String,
    pub settings: serde_json::Value,
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug, Default)]
pub struct SolidityConfig {
    pub version: String,
}

#[derive(Default)]
pub struct HardhatConfigBuilder {
    config: HardhatConfig,
}

impl Default for HardhatConfig {
    fn default() -> Self {
        Self {
            zksolc: ZksolcConfig {
                version: DEFAULT_ZKSOLC_VERSION.to_string(),
                settings: serde_json::json!({}),
            },
            solidity: SolidityConfig {
                version: DEFAULT_SOLIDITY_VERSION.to_string(),
            },
        }
    }
}

impl HardhatConfig {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn to_string_config(&self) -> String {
        let config_prefix_js = r#"
import { HardhatUserConfig } from "hardhat/config";

import "@matterlabs/hardhat-zksync-solc";
import "@matterlabs/hardhat-zksync-verify";

export const zkSyncTestnet = process.env.NODE_ENV == "test"
? {
    url: "http://127.0.0.1:8011",
    ethNetwork: "http://127.0.0.1:8045",
    zksync: true,
  }
: {
    url: "https://sepolia.era.zksync.dev",
    ethNetwork: "sepolia",
    zksync: true,
    verifyURL: "https://explorer.sepolia.era.zksync.dev/contract_verification"
  };

export const zkSyncMainnet = {
    url: "https://mainnet.era.zksync.io",
    ethNetwork: "mainnet",
    zksync: true,
    verifyURL: "https://zksync2-mainnet-explorer.zksync.io/contract_verification"
  };
"#;

        let config = format!(
            r#"{}
const config: HardhatUserConfig = {{
  zksolc: {{
    version: "{}",
    settings: {{}},
  }},
  defaultNetwork: "zkSyncTestnet",
  networks: {{
    hardhat: {{
      zksync: false,
    }},
    zkSyncTestnet,
    zkSyncMainnet,
  }},
  solidity: {{
    version: "{}",
  }},
}};

export default config;
"#,
            config_prefix_js, self.zksolc.version, self.solidity.version
        );

        config
    }
}

impl HardhatConfigBuilder {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn zksolc_version(&mut self, version: &str) -> &mut Self {
        self.config.zksolc.version = version.to_string();
        self
    }

    pub fn solidity_version(&mut self, version: &str) -> &mut Self {
        self.config.solidity.version = version.to_string();
        self
    }

    pub fn build(&self) -> HardhatConfig {
        self.config.clone()
    }
}
