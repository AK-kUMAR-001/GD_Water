const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const path = require('path');
const fs = require('fs');

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

      // Also generate a clean high-resolution PNG image for scanning comfort
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
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log(`[WhatsApp Bot] Connection closed. Reconnecting: ${shouldReconnect}`);
      if (shouldReconnect) {
        startBot();
      }
    } else if (connection === 'open') {
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
      if (!msg.message || msg.key.fromMe) return;

      const senderJid = msg.key.remoteJid;
      // Skip status update events or group chats
      if (!senderJid.endsWith('@s.whatsapp.net')) return;

      const senderPhone = senderJid.split('@')[0];
      
      const bodyText = msg.message.conversation || 
                       msg.message.extendedTextMessage?.text || 
                       '';

      if (!bodyText.trim()) return;

      console.log(`[WhatsApp Bot] Received message from ${senderPhone}: "${bodyText}"`);

      // Forward message to Express API emulator endpoint to register the complaint
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
        // Send reply back to WhatsApp citizen
        await sock.sendMessage(senderJid, { text: data.reply });
        console.log(`[WhatsApp Bot] Replied successfully to ${senderPhone}`);
      }
    } catch (err) {
      console.error('[WhatsApp Bot] Error processing message:', err.message);
    }
  });
}

// Start the bot
startBot();
