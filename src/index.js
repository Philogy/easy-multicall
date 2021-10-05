const MulticallAbi = require('./MulticallAbi.json')
const { ethers } = require('ethers')

const doMulticall = async (multicaller, calls) => {
  const { blockNumber, returnData } = await multicaller.aggregate(calls.map(({ call }) => call))
  const decodedReturnData = calls.map(({ decodeReturn: decoder }, i) => decoder(returnData[i]))
  return {
    blockNumber: blockNumber.toNumber(),
    returnData: decodedReturnData
  }
}

const getMulticaller = (address, provider) => {
  const multicaller = new ethers.Contract(address, MulticallAbi, provider)
  return async (calls, includeBlock = false) => {
    const res = await doMulticall(
      multicaller,
      calls.reduce(
        (allCalls, newCalls) => allCalls.concat(newCalls instanceof Array ? newCalls : [newCalls]),
        []
      )
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
    const call = {
      target: address,
      callData: cIntf.encodeFunctionData(method, args)
    }
    return {
      call,
      decodeReturn: (data) => cIntf.decodeFunctionResult(method, data)
    }
  }
}

module.exports = { getMulticaller, createCallEncoder }
