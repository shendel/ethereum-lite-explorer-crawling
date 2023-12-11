const express = require("express");
const app = express();
const port = 3006;
const { rpcCheckBlockNum } = require('./rpcCheckBlockNum')
const { rpcRecheckBlockNum } = require('./rpcRecheckBlockNum')

require('dotenv').config()

let rpcCheckBlockNumError = false
// forever
setInterval(() => {
  rpcCheckBlockNum().then((isOk) => {
    rpcCheckBlockNumError = false
  }).catch((notOk) => {
    rpcCheckBlockNumError = true
  })
}, 2000) // Checking latest block data every 2 seconds

setInterval(() => rpcRecheckBlockNum() , 60000) // Checking 30 previous block data every minute

app.get("/", (req, res) =>{
    res.json({
      Type: "RPC Crawling server",
      CheckBlockNumError: rpcCheckBlockNumError,
    })
})

app.listen(port, () => {
  console.log(`RPC Crawl server started at ${port}`);
})
