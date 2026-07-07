const crypto = require('crypto');

// 1. Paste your PWA Credentials here
const clientId = '76f777354dc5452f95ef716bd4d946fa';
const secretKey = '930340CBD53152C7';

// 2. Dummy Transaction Data
const customerTransactionId = 'TEST-123456';
const item = 'Vintage Jacket';
const amount = '100';

// 3. Generate the Checksum (Swich:customer_transaction_id:item:amount)
const rawString = `Swich:${customerTransactionId}:${item}:${amount}`;
const checksum = crypto.createHmac('sha256', secretKey).update(rawString).digest('hex').toUpperCase();

// 4. Construct the Token JSON Payload (Must match exact capitalization)
const payload = {
  ClientId: clientId,
  CustomerTransactionId: customerTransactionId,
  Item: item,
  Amount: amount,
  Channel: 0,
  Checksum: checksum,
  Description: 'Test Payment',
  PayeeName: 'Test User',
  Email: 'test@example.com',
  MSISDN: '03000000000',
  Currency: 'PKR'
};
const jsonStr = JSON.stringify(payload);
console.log('\n--- 1. Raw JSON Payload ---');
console.log(jsonStr);

// 5. AES-128-ECB Encryption using SecretKey
const cipher = crypto.createCipheriv('aes-128-ecb', Buffer.from(secretKey, 'utf8'), null);
let encryptedToken = cipher.update(jsonStr, 'utf8', 'hex');
encryptedToken += cipher.final('hex');
console.log('\n--- 2. Encrypted Token ---');
console.log(encryptedToken);

// 6. Test the POST Request (Requires node version with native fetch, or you can use axios/request)
console.log('\n--- 3. Pinging Swich v2.0 API... ---');
fetch('https://sandbox-payinpwa20.swichnow.com/Transaction/Index', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    ClientId: clientId,
    Token: encryptedToken
  })
}).then(res => {
  console.log('Status Code:', res.status);
  return res.text();
}).then(text => {
  console.log('\n--- 4. Response HTML (First 300 chars) ---');
  console.log(text.substring(0, 300));
  console.log('\n✅ SUCCESS! If you see HTML above with <title> or <body> tags, the AES encryption worked perfectly!');
}).catch(console.error);
