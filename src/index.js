const MulticallAbi = require('./MulticallAbi.json')
const { ethers } = require('ethers')

const doMulticall = async (multicaller, calls, blockTag) => {
  const { blockNumber, returnData } = await multicaller.aggregate(calls.map(({ call }) => call), { blockTag })
  const decodedReturnData = calls.map(({ decodeReturn: decoder }, i) => decoder(returnData[i]))
  return {
    blockNumber: blockNumber.toNumber(),
    returnData: decodedReturnData
  }
}

const getMulticaller = (address, provider) => {
  const multicaller = new ethers.Contract(address, MulticallAbi, provider)
  return async (calls, { includeBlock = false, blockTag = undefined }) => {
    const res = await doMulticall(
      multicaller,
      calls.reduce(
        (allCalls, newCalls) => allCalls.concat(newCalls instanceof Array ? newCalls : [newCalls]),
        []
      ),
      blockTag
    )
    const returnData = []
    let i = 0
    calls.forEach((callRow) => {
      if (callRow instanceof Array) {
        const len = callRow.length
        returnData.push(res.returnData.slice(i, (i += len)))
      } else {
        returnData.push(res.returnData[i++])
      }
    })
    if (includeBlock) return { blockNumber: res.blockNumber, returnData }
    return returnData
  }
}

const createCallEncoder = (abi, address) => {
  const cIntf = new ethers.utils.Interface(abi)
  return (method, ...args) => {
    let methodName, unpackSingle
    if (typeof method === 'string') {
      methodName = method
      unpackSingle = true
    } else {
      methodName = method.method
      unpackSingle = method.unpackSingle
    }

    return {
      call: {
        target: address,
        callData: cIntf.encodeFunctionData(methodName, args)
      },
      decodeReturn: (data) => {
        const decoded = cIntf.decodeFunctionResult(methodName, data)
        if (unpackSingle && decoded instanceof Array && decoded.length === 1) {
          return decoded[0]
        }
        return decoded
      }
    }
  }
}

module.exports = { getMulticaller, createCallEncoder }
