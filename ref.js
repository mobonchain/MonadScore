const fs = require('fs');
const axios = require('axios');
const readline = require('readline');
const { HttpsProxyAgent } = require('https-proxy-agent');
const colors = require('colors');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const BASE_URL = 'https://mscore.onrender.com';

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

let wallets = [];
if (fs.existsSync('wallet.txt')) {
    wallets = fs.readFileSync('wallet.txt', 'utf-8')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
}

async function registerWallet(walletAddress, referralCode, proxy) {
    const data = {
        wallet: walletAddress,
        invite: referralCode
    };

    try {
        const config = {
            method: 'post',
            url: `${BASE_URL}/user`,
            data,
            httpAgent: proxy,
            httpsAgent: proxy,
            timeout: 15000
        };

        const res = await axios(config);
        return res.data;
    } catch (error) {
        console.log(colors.red(`Lỗi khi đăng ký ví ${walletAddress}: ${error.message}`));
        return null;
    }
}

async function promptUser(message) {
    return new Promise(resolve => rl.question(message, resolve));
}

async function startRefProgram() {
    const referralCode = await promptUser('Nhập referral code: '.cyan);

    for (const walletAddress of wallets) {
        const proxy = proxies[Math.floor(Math.random() * proxies.length)];

        if (!proxy) {
            console.log(colors.yellow('Không có proxy hợp lệ để sử dụng.'));
            continue;
        }

        console.log(colors.green(`Đang tiến hành đăng ký ví ${walletAddress}...`));

        const result = await registerWallet(walletAddress, referralCode, proxy);
        if (result?.success) {
            console.log(colors.green(`✔️ Ví ${walletAddress} đã đăng ký thành công!`));
        } else {
            console.log(colors.red(`❌ Đăng ký ví ${walletAddress} thất bại.`));
        }
    }

    rl.close();
    console.log(colors.cyan('Quá trình đăng ký hoàn tất'));
}

startRefProgram();
