const fs = require('fs');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const colors = require('colors');

const BASE_URL = 'https://mscore.onrender.com';

let wallets = [];
if (fs.existsSync('wallet.txt')) {
    wallets = fs.readFileSync('wallet.txt', 'utf-8')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
}

let proxies = [];
if (fs.existsSync('proxy.txt')) {
    const proxyLines = fs.readFileSync('proxy.txt', 'utf-8')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

    proxies = proxyLines.map(proxy => {
        try {
            const agent = new HttpsProxyAgent(proxy);
            return agent;
        } catch (e) {
            console.log(colors.red(`Lỗi khi phân tích proxy: ${proxy} - ${e.message}`));
            return null;
        }
    }).filter(proxy => proxy !== null);
}

let logs = [];
if (fs.existsSync('log.json')) {
    logs = JSON.parse(fs.readFileSync('log.json', 'utf-8'));
}

async function startNode(walletAddress, proxy) {
    const data = {
        wallet: walletAddress,
        startTime: Date.now()
    };

    try {
        const config = {
            method: 'put',
            url: `${BASE_URL}/user/update-start-time`,
            data,
            httpAgent: proxy,
            httpsAgent: proxy,
            timeout: 15000
        };

        const res = await axios(config);
        return res.data;
    } catch (error) {
        console.log(colors.red(`Lỗi khi cập nhật startTime cho ví ${walletAddress}: ${error.message}`));
        return null;
    }
}

function isNodeUpdated(walletAddress) {
    const today = new Date().toISOString().slice(0, 10); 
    return logs.some(log => log.wallet === walletAddress && log.success && log.timestamp.startsWith(today));
}

async function startNodeDaily() {
    const now = new Date();
    let targetTime = new Date(now.setHours(7, 0, 0, 0));
    targetTime.setMinutes(targetTime.getMinutes() + getRandomDelay());

    const delay = targetTime - Date.now();
    console.log(colors.cyan(`Chờ đến ${targetTime.toLocaleTimeString()} để bắt đầu...`));

    setTimeout(async () => {
        for (const walletAddress of wallets) {
            if (isNodeUpdated(walletAddress)) {
                console.log(colors.yellow(`Node cho ví ${walletAddress} đã được cập nhật hôm nay, bỏ qua.`));
                continue;
            }

            const proxy = proxies[Math.floor(Math.random() * proxies.length)];
            const result = await startNode(walletAddress, proxy);
            if (result?.success) {
                console.log(colors.green(`✔️ Cập nhật startTime cho ví ${walletAddress} thành công!`));

                logs.push({
                    wallet: walletAddress,
                    success: true,
                    timestamp: new Date().toISOString()
                });

                fs.writeFileSync('log.json', JSON.stringify(logs, null, 2));
            } else {
                console.log(colors.red(`❌ Cập nhật startTime cho ví ${walletAddress} thất bại.`));

                logs.push({
                    wallet: walletAddress,
                    success: false,
                    timestamp: new Date().toISOString()
                });

                fs.writeFileSync('log.json', JSON.stringify(logs, null, 2));
            }

            await new Promise(resolve => setTimeout(resolve, 10000));
        }

        startNodeDaily();
    }, delay);
}
function getRandomDelay() {
    return Math.floor(Math.random() * (10 - 2 + 1)) + 2;
}

startNodeDaily();
