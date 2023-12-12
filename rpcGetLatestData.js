const { db } = require('./db')
const { etherApi } = require('./etherApi')
const { SHA3 } = require('sha3')

const rpcGetLatestData = (blockNumber) => {
  eth_getBlockByNumber(blockNumber)
}

const eth_getBlockByNumber = async(blockNumber) => {
  let hex = blockNumber.toString(16)

  const response = await etherApi({
    "jsonrpc":"2.0",
    "method":"eth_getBlockByNumber",
    "params":["0x" + hex, true],
    "id":9
  })

  if(response.data.result === null){
    setTimeout(()=>eth_getBlockByNumber(blockNumber),1000)
  } else {
    let blockTxArr = response.data.result.transactions
    db_insertBlockData(response.data.result, blockTxArr)
  }
}

const db_insertBlockData = (data, blockTxArr) => {
  let blocknumber = parseInt(data.number, 16)
  let blockhash = data.hash
  let transaction_length = data.transactions.length

  let t = parseInt(data.timestamp,16)
  let date = new Date(t*1000);
  let year = date.getFullYear();
  let month = "0" + (date.getMonth()+1);
  let day = "0" + date.getDate();
  let hour = "0" + date.getHours();
  let minute = "0" + date.getMinutes();
  let second = "0" + date.getSeconds();
  let time_stamp = year + "-" + month.substr(-2) + "-" + day.substr(-2) + " " + hour.substr(-2) + ":" + minute.substr(-2) + ":" + second.substr(-2);

  const txHashInsert = "INSERT INTO block_data (blocknumber, time_stamp, blockhash, transaction_length) VALUES (?, ?, ?, ?);"
  db.query(txHashInsert, [blocknumber, time_stamp, blockhash, transaction_length], (err, result) => {
    console.log(blocknumber, "block data saved")
  })
  db_insertTxsData(blockTxArr, time_stamp)
}

const db_insertTxsData = async(blockTxArr, time_stamp) => {
  if(blockTxArr.length > 0){
    for(let i=0; i < blockTxArr.length; i++){
      txHash = blockTxArr[i].hash,
      blockNumber = parseInt(blockTxArr[i].blockNumber, 16),
      blockNumberHex = blockTxArr[i].blockNumber,
      fromAddress = blockTxArr[i].from,
      
      value = blockTxArr[i].value


      if(blockTxArr[i].to === null){
        const response = await etherApi({
          "jsonrpc":"2.0",
          "method":"eth_getTransactionReceipt",
          "params":[blockTxArr[i].hash],
          "id":9
        })

        toAddress = response.data.result.contractAddress
        const contractByteCode = await etherApi({
          "jsonrpc":"2.0",
          "method":"eth_getCode",
          "params":[toAddress, "latest"],
          "id": 1
        })
        const byteCode = contractByteCode.data.result
        const hash = new SHA3(256);

        
        const contractDataInsert = 
          "INSERT INTO contract_data " +
          "(blockNumber, contractAddress, sha3) VALUES "+
          "(?,            ?,              ?);"
        const dbArgs = [
          blockNumber,    toAddress,      hash.digest('hex')
        ]
        db.query(contractDataInsert, dbArgs, (err, result) => {
          if(err) {
            console.log("[DB Fail] ", err.message)
          }    
        })

      } else {
        toAddress = blockTxArr[i].to
      }
      
      const txHashInsert = "INSERT INTO transaction_data (txHash, blockNumber, blockNumberHex, time_stamp ,fromAddress, toAddress, value) VALUES (?, ?, ?, ?, ?, ?, ?);"
      db.query(txHashInsert, [txHash, blockNumber, blockNumberHex, time_stamp, fromAddress, toAddress, value], (err, result) => {
        if(err) {
          console.log("[DB Fail] ", err.message)
        }
      })
    }
  } else {
    console.log("no transaction")
  }
}

module.exports = { rpcGetLatestData };
