const {Worker} = require('worker_threads')
const {getTokens, getEmails} = require('./src/constants/credentials')
const {proxies} = require('./src/constants/proxies')
const {initHook} = require("./src/utils/webhook");
const usernames = [""]
const sessionsPerProxy = 1
const workers = []
const hook = initHook("")

function createEmailWorker(email, proxyCounter) {
    const worker = new Worker('./src/index.js', {workerData: {email, proxy: proxies[proxyCounter], index: emails.indexOf(email)}})
    worker.on('exit', (code) => {
        // restart worker
        console.log(`Worker ${email} exited with code ${code}. Restarting...`)
        workers.splice(workers.indexOf(worker), 1)
        createEmailWorker(email, proxyCounter)
    })

    initWorker(worker)
}

function createTokenWorker(token, proxyCounter) {
    const worker = new Worker('./src/index.js', {workerData: {token: token, proxy: proxies[proxyCounter]}})
    worker.on('exit', (code) => {
        // restart worker
        console.log(`Worker ${token.substring(0, 25) + "..."} exited with code ${code}. Restarting...`)
        workers.splice(workers.indexOf(worker), 1)
        createTokenWorker(email, proxyCounter)
    })

    initWorker(worker)
}

function initWorker(worker) {
    workers.push(worker)
    worker.on('message', ({type, data}) => {
        switch (type) {
            case "CPacketLogin": {
                usernames.push(data)
                workers.forEach((worker) => {
                    worker.postMessage({type: "SPacketWhitelistUpdate", data: usernames})
                })
                break;
            }
        }
    })
}

async function main() {
    let proxyCounter = -1
    for (const email of getEmails()) {
        if (getEmails().indexOf(email) % sessionsPerProxy === 0) 
            proxyCounter++
        createEmailWorker(email, proxyCounter)
        await new Promise((resolve) => setTimeout(resolve, 2500))
    }
    for (const token of getTokens()) {
        if (getTokens().indexOf(token) % sessionsPerProxy === 0) 
            proxyCounter++
        createTokenWorker(token, proxyCounter)
        await new Promise((resolve) => setTimeout(resolve, 2500))
    }

    process.stdin.on("data", data => {
        data = data.toString().trim()
        workers.forEach((worker) => {
            worker.postMessage({
                type: `command`,
                data
            })
        })
    })

    hook.sendEmbedded(`Pit Bots Started`, `Party command: \`/p${usernames.join(' ')}\``, "#ef8d8d")
    console.log(`Initiated ${workers.length} workers. Party command: /p ${usernames.join(' ')}`)
}

main()
