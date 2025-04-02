const fs = require('fs');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const colors = require('colors');
const { ethers, Wallet } = require('ethers');

const BASE_URL = 'https://mscore.onrender.com';

async function readAccounts() {
  const accounts = [];
  try {
    const data = await fs.promises.readFile('wallet.txt', 'utf-8');
    const privateKeys = data.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    for (const privateKey of privateKeys) {
      const wallet = new Wallet(privateKey);
      accounts.push({
        walletAddress: wallet.address,
        privateKey: privateKey
      });
    }

    return accounts;
  } catch (error) {
    console.error(colors.red(`Lỗi khi đọc file wallet.txt: ${error.message}`));
    return [];
  }
}

async function readProxies() {
  try {
    const data = await fs.promises.readFile('proxy.txt', 'utf-8');
    return data.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  } catch (error) {
    console.error(colors.red(`Lỗi khi đọc file proxy.txt: ${error.message}`));
    return [];
  }
}

function getHeaders(token = null) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
    'Origin': 'https://monadscore.xyz',
    'Referer': 'https://monadscore.xyz/'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

function getAxiosConfig(proxy, token = null) {
  const config = {
    headers: getHeaders(token),
    timeout: 120000
  };
  if (proxy) {
    config.httpsAgent = new HttpsProxyAgent(proxy);
  }
  return config;
}

async function requestWithRetry(method, url, payload = null, config = null, retries = 3, backoff = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      if (method === 'get') return await axios.get(url, config);
      if (method === 'post') return await axios.post(url, payload, config);
      if (method === 'put') return await axios.put(url, payload, config);
      throw new Error(`Unsupported method: ${method}`);
    } catch (error) {
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, backoff));
        backoff *= 1.5;
      } else {
        throw error;
      }
    }
  }
}

async function getPublicIP(proxy) {
  try {
    const response = await requestWithRetry('get', 'https://api.ipify.org?format=json', null, getAxiosConfig(proxy));
    return response?.data?.ip || 'IP không tìm thấy';
  } catch {
    return 'Lỗi khi lấy IP';
  }
}

async function getInitialToken(walletAddress, proxy) {
  const url = `${BASE_URL}/user`;
  const response = await requestWithRetry('post', url, { wallet: walletAddress, invite: null }, getAxiosConfig(proxy));
  return response.data.token;
}

async function loginUser(walletAddress, proxy, initialToken) {
  const url = `${BASE_URL}/user/login`;
  const response = await requestWithRetry('post', url, { wallet: walletAddress }, getAxiosConfig(proxy, initialToken));
  return response.data.token;
}

async function updateStartTime(walletAddress, proxy, token) {
  const url = `${BASE_URL}/user/update-start-time`;
  const payload = { wallet: walletAddress, startTime: Date.now() };
  try {
    const response = await requestWithRetry('put', url, payload, getAxiosConfig(proxy, token));
    return {
      message: response.data.message || 'Cập nhật node thành công',
      totalPoints: response.data.user?.totalPoints ?? 'Chưa xác định'
    };
  } catch (error) {
    return {
      message: `Cập nhật node thất bại: ${error.response?.data?.message || error.message}`,
      totalPoints: error.response?.data.user?.totalPoints ?? 'N/A'
    };
  }
}

async function processAccount(account, index, total, proxy) {
  const { walletAddress, privateKey } = account;
  console.log(colors.cyan('='.repeat(80)));
  console.log(colors.green(`Tài khoản  : ` + `${index + 1}`));
  console.log(colors.green(`Địa chỉ ví : ` + `${walletAddress}`));
  const usedIP = await getPublicIP(proxy);
  console.log(colors.green(`Proxy IP   : ` + `${usedIP}`));

  let wallet;
  try {
    wallet = new Wallet(privateKey);
  } catch (error) {
    console.error(colors.red(`Lỗi tạo ví : ${error.message}`));
    return;
  }

  let loginToken;
  try {
    const initialToken = await getInitialToken(walletAddress, proxy);
    const signMessage = `Request from

monadscore.xyz

Message

Sign this message to verify ownership and continue to dashboard!

${walletAddress}`;
    await wallet.signMessage(signMessage);
    loginToken = await loginUser(walletAddress, proxy, initialToken);
    console.log(colors.green('Đăng nhập thành công'));
  } catch (error) {
    console.error(colors.red(`Lỗi khi đăng nhập: ${error.message}`));
    return;
  }

  console.log(colors.yellow('Đang Run Node...'));
  const { message, totalPoints } = await updateStartTime(walletAddress, proxy, loginToken);
  if (/successfully|berhasil|thành công/i.test(message)) {
    console.log(colors.green(`✅ Run Node thành công : ${message}`));
  } else {
    console.log(colors.red(`❌ Run Node thất bại : ${message}`));
  }

  console.log(colors.green(`📌 Tổng Điểm: ${totalPoints}`));
  await new Promise(resolve => setTimeout(resolve, 10000));
}

async function run() {
  const accounts = await readAccounts();
  const proxies = await readProxies();

  if (accounts.length === 0) {
    console.log(colors.red('Không tìm thấy PrivateKey nào hợp lệ trong wallet.txt!'));
    return;
  }

  for (let i = 0; i < accounts.length; i++) {
    const proxy = proxies[i % proxies.length] || null;
    try {
      await processAccount(accounts[i], i, accounts.length, proxy);
    } catch (error) {
      console.error(colors.red(`Lỗi ở tài khoản ${i + 1}: ${error.message}`));
    }
  }

  console.log(colors.magenta('Hoàn thành Run Node cho tất cả tài khoản!'));
}

run();
