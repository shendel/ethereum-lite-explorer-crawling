const { db } = require('./db')
const { etherApi } = require('./etherApi')
const { rpcGetLatestData } = require('./rpcGetLatestData')

const rpcCheckBlockNum = () => {
  return eth_blockNumber()
}

const eth_blockNumber = async() => {
  etherApi({
    "jsonrpc":"2.0",
    "method":"eth_blockNumber",
    "params":[],
    "id":9
  }).then((response) => {
    if (response && response.data && response.data.result) {
      const latestBlock = response.data.result
      db_checkBlockNum(latestBlock)
    } else {
      console.log('[Fail] eth_blockNumber - incorrect result')
    }
  })
}

const db_checkBlockNum = async(latestBlock) => {
  let blockNumber = parseInt(latestBlock, 16)

  // @to-do - need db optimization
  const txHashInsert = "SELECT IF(EXISTS(SELECT * from block_data WHERE blocknumber = ?), '1', '0' ) as RESULT";
  db.query(txHashInsert, [blockNumber], (err, result) => {
    let string = JSON.stringify(result)
    let parse = JSON.parse(string)
    let checkBlockNum = parse[0].RESULT

    if(checkBlockNum == '0'){
      rpcGetLatestData(blockNumber)
    }
  })
}

module.exports = { rpcCheckBlockNum };