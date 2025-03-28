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

function getHeaders() {
    return {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'origin': 'https://monadscore.xyz',
        'referer': 'https://monadscore.xyz/'
    };
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
            timeout: 15000,
            headers: getHeaders()
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

async function processWallets() {
    let hasUpdated = false;

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
            hasUpdated = true;
        } else {
            console.log(colors.red(`❌ Cập nhật startTime cho ví ${walletAddress} thất bại.`));

            logs.push({
                wallet: walletAddress,
                success: false,
                timestamp: new Date().toISOString()
            });

            fs.writeFileSync('log.json', JSON.stringify(logs, null, 2));
            hasUpdated = true;
        }

        await new Promise(resolve => setTimeout(resolve, 10000));
    }

    return hasUpdated;
}

async function startNodeDaily() {
    const now = new Date();
    const targetTime = new Date(now.setHours(7, 2, 0, 0));

    if (now.getTime() >= targetTime.getTime()) {
        targetTime.setDate(targetTime.getDate() + 1);
    }

    const delay = targetTime - Date.now();
    console.log(colors.cyan(`Chờ đến ${targetTime.toLocaleTimeString()} để bắt đầu lại...`));

    setTimeout(async () => {
        const hasUpdated = await processWallets();

        if (hasUpdated) {
            const extraDelay = getRandomDelay() * 60 * 1000;
            console.log(colors.cyan(`Đợi thêm ${extraDelay / 60000} phút trước khi bắt đầu lại...`));

            setTimeout(startNodeDaily, extraDelay);
        } else {
            startNodeDaily();
        }
    }, delay);
}

function getRandomDelay() {
    return Math.floor(Math.random() * (10 - 2 + 1)) + 2;
}

async function runOnce() {
    const hasUpdated = await processWallets();

    if (hasUpdated) {
        await startNodeDaily();
    } else {
        console.log(colors.cyan("Không có ví nào cần xử lý. Đợi đến 7h02 sáng hôm sau..."));
        await startNodeDaily();
    }
}

runOnce();
