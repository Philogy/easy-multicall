# easy-multicall

## Installation

```
npm install easy-multicall
```

## Usage

Note: All addresses for the example were randomly generated.

```javascript
const { ethers } = require('ethers')
const { getMulticaller, createCallEncoder } = require('easy-multicall')
const ERC20 = require('/your-artifacts-storage-folder/ERC20.json')

async function main() {
  // default localhost:8545 provider
  const provider = new ethers.provider.JsonRpcProvider()
  const multicall = getMulticaller('0xF4697bDEF3477d00c464909Edf90f322C7200C38', provider)
  const accounts = [
    '0x15fc9e8208C23708DA9E147bDcD2D9B3bf10990b',
    '0xa6ecb8644E9F1108Fc8e126ab89027Ba3710FA2f',
    '0x3B4d6Ee17D8e590693B1D122023798c963eEd66c'
  ]
  const tokenCallEncoder = createCallEncoder(ERC20.abi, '0xcc19BC96146ffE1703408895D1475E67B38788d1')

  // calls have to be an array created by a call encoder
  // calls can be nested 1 layer deep
  const [[totalSupply], balances] = await multicall([
    tokenCallEncoder('totalSupply'),
    accounts.map(account => tokenCallEncoder('balanceOf', account))
  ])

  console.log('total supply:', ethers.utils.formatUnits(totalSupply))
  balances.forEach((balance, i) => {
    console.log(`the balance of ${accounts[i]} is ${ethers.utils.formatUnits(balance)}`)
  })
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
```
