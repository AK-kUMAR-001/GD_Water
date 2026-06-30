const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const path = require('path');
const fs = require('fs');
const express = require('express');

// Global socket reference for outbound messages
let activeSock = null;

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, '../data/bot-auth-session'));

  console.log('[WhatsApp Bot] Initializing connection socket...');
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: 'silent' })
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\n--- SCAN THIS QR CODE WITH YOUR WHATSAPP TO ACTIVATE THE BOT ---');
      qrcode.generate(qr, { small: true });
      console.log('----------------------------------------------------------------\n');

      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(qr)}`;
      fetch(qrUrl)
        .then(res => res.arrayBuffer())
        .then(buffer => {
          const destPath = path.join(__dirname, '../public/whatsapp-qr.png');
          fs.writeFileSync(destPath, Buffer.from(buffer));
          console.log(`[WhatsApp Bot] High-res QR saved to: ${destPath}`);
          console.log(`Please scan it at: http://localhost:5173/whatsapp-qr.png`);
        })
        .catch(err => console.error('[WhatsApp Bot] Failed to generate PNG QR:', err.message));
    }

    if (connection === 'close') {
      activeSock = null;
      const isLoggedOut = lastDisconnect?.error?.output?.statusCode === DisconnectReason.loggedOut;
      console.log(`[WhatsApp Bot] Connection closed. Reconnecting: ${!isLoggedOut}`);
      
      if (isLoggedOut) {
        console.log('[WhatsApp Bot] Session logged out or invalidated. Clearing credentials cache to reset...');
        try {
          const sessionPath = path.join(__dirname, '../data/bot-auth-session');
          fs.rmSync(sessionPath, { recursive: true, force: true });
          console.log('[WhatsApp Bot] Credentials cache cleared successfully.');
        } catch (e) {
          console.error('[WhatsApp Bot] Cache clear failed:', e.message);
        }
        setTimeout(startBot, 1500);
      } else {
        startBot();
      }
    } else if (connection === 'open') {
      activeSock = sock;
      console.log('\n=========================================');
      console.log('[WhatsApp Bot] Connected successfully!');
      console.log('Bot is now online and active on your phone.');
      console.log('=========================================\n');
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async (m) => {
    try {
      const msg = m.messages[0];
      if (!msg) return;

      console.log(`[WhatsApp Debug] Incoming raw message payload:`, JSON.stringify({
        key: msg.key,
        messageKeys: msg.message ? Object.keys(msg.message) : null,
        pushName: msg.pushName
      }, null, 2));

      if (!msg.message || msg.key.fromMe) return;

      const senderJid = msg.key.remoteJid;
      if (!senderJid.endsWith('@s.whatsapp.net') && !senderJid.endsWith('@lid')) return;

      let senderPhone = senderJid.split('@')[0];
      if (msg.key.remoteJidAlt && msg.key.remoteJidAlt.endsWith('@s.whatsapp.net')) {
        senderPhone = msg.key.remoteJidAlt.split('@')[0];
      }
      
      const bodyText = msg.message.conversation || 
                       msg.message.extendedTextMessage?.text || 
                       msg.message.imageMessage?.caption ||
                       msg.message.videoMessage?.caption ||
                       '';

      console.log(`[WhatsApp Debug] Extracted text: "${bodyText}" from sender: ${senderPhone}`);

      if (!bodyText.trim()) return;

      const response = await fetch('http://localhost:5000/api/whatsapp/emulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: senderPhone,
          message: bodyText
        })
      });
      const data = await response.json();

      if (data.success) {
        await sock.sendMessage(senderJid, { text: data.reply });
        console.log(`[WhatsApp Bot] Replied successfully to ${senderPhone}`);
      }
    } catch (err) {
      console.error('[WhatsApp Bot] Error processing message:', err.message);
    }
  });
}

// Start outbound API server on Port 5001 for main Express Server triggers
const botApi = express();
botApi.use(express.json());

botApi.post('/send', async (req, res) => {
  const { phone, text } = req.body;
  if (!activeSock) {
    return res.status(503).json({ success: false, error: 'WhatsApp bot connection is offline.' });
  }

  try {
    const cleanPhone = phone.replace('+', '').replace(' ', '').trim();
    const jid = cleanPhone.includes('@') ? cleanPhone : `${cleanPhone}@s.whatsapp.net`;
    await activeSock.sendMessage(jid, { text });
    console.log(`[WhatsApp Bot API] Outbound alert successfully sent to ${cleanPhone}`);
    res.json({ success: true });
  } catch (err) {
    console.error(`[WhatsApp Bot API] Outbound send failed:`, err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

botApi.listen(5001, () => {
  console.log('[WhatsApp Bot] Outbound API gateway listening on port 5001');
});

// Start the bot
startBot();
