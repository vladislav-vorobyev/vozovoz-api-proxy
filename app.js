const express = require('express')
const axios = require('axios')
const cors = require('cors')

// CORS accepted origins
const whitelist = ['http://localhost:3000']

// process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0

const app = express()

app.use(cors({ origin: whitelist, credentials: true }))

// Parse JSON bodies (as sent by API clients)
app.use(express.json())

app.use('/', (request, response) => {
  console.log('#===================>\nURL:', request.originalUrl)

  if (request.method == 'POST') {
    var body = request.body
    // console.log('#=== POST body:\n', body)
  }

  // Prepare target URL
  let targetUrl = process.env.API_URL

  console.log('#===== Proxy to: ' + targetUrl)

  // Prepare axios headers
  let headers = {
    'Content-type': 'application/json',
    Authorization: 'Basic ' + process.env.API_AUTH,
  }
  // console.log(headers)

  let data = body || { object: 'version', action: 'get' }
  console.log('#--- data ---\n', data)

  // Request to target system
  axios({
    method: request.method,
    url: targetUrl,
    headers: headers,
    data: data,
    responseType: 'stream',
    // maxRedirects: 0,
    validateStatus: () => true,
  })
    .then((axiosResp) => {
      console.log('#=== Response: =====================')
      console.log('Status:', axiosResp.status)
      // console.log(axiosResp.headers)

      // Pass all data to response
      for (const [key, value] of Object.entries(axiosResp.headers)) {
        if (key.substring(0, 14).toLocaleLowerCase() !== 'access-control') {
          response.append(key, value)
        }
      }
      response.status(axiosResp.status)
      axiosResp.data.pipe(response)
    })
    .catch((axiosErr) => {
      console.log('#=== ERR: ==========================')
      console.log(axiosErr)
      console.log('#STATUS: ', axiosErr.response?.status ?? '-')

      let err_msg = 'API-proxy: internal error'
      response.status(500).send('{ "error": "' + err_msg + '" }')
    })
})

module.exports = app
