const fs = require("fs")
const ias = fs.readFileSync("./ias.json").toString()
const tokens = []
for (const account of JSON.parse(ias).accounts) {
    tokens.push(account.accessToken)
}

const emails = [
    /*
    Put your email address of account
    */
]

module.exports.getEmails = () => {
    return emails
}

module.exports.getTokens = () => {
    return tokens
}
