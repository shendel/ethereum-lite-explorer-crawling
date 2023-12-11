require('dotenv').config()

const axios = require("axios");

const etherApiResp = axios.create({
  baseURL: process.env.RPC,
  headers : {'content-type' : "application/json"}
})

const etherApi = (options) => {
  return new Promise((resolve) => {
    const doResponse = () => {
      etherApiResp.post('/', options).then((answer) => {
        resolve(answer)
      }).catch((err) => {
        console.log('[Json RPC Fail]', err.message)
        setTimeout(doResponse, 5000)
      })
    }
    doResponse()
  })
}
module.exports = { etherApi }