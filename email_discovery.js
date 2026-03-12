const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const os = require('os');

const OAUTH_CREDS_PATH = path.join(os.homedir(), '.config/aios-email/oauth-credentials.json');

async function authenticate() {
  const credentialsData = fs.readFileSync(OAUTH_CREDS_PATH, 'utf-8');
  const credentials = JSON.parse(credentialsData);
  
  const oauth2Client = new google.auth.OAuth2(
    credentials.client_id,
    credentials.client_secret,
    credentials.redirect_uris[0]
  );
  
  oauth2Client.setCredentials({
    access_token: credentials.access_token,
    refresh_token: credentials.refresh_token,
    scope: credentials.scope,
    token_type: credentials.token_type,
    expiry_date: credentials.expiry_date
  });
  
  return oauth2Client;
}

async function discoverEmails(auth) {
  const gmail = google.gmail({ version: 'v1', auth });
  
  // Get user profile
  const profile = await gmail.users.getProfile({ userId: 'me' });
  console.log('\n=== USER PROFILE ===');
  console.log(`Email: ${profile.data.emailAddress}`);
  console.log(`Total messages: ${profile.data.messagesTotal}`);
  console.log(`Threads: ${profile.data.threadsTotal}`);
  
  // Get labels
  const labels = await gmail.users.labels.list({ userId: 'me' });
  console.log('\n=== LABELS (Top by message count) ===');
  
  const labelStats = [];
  for (const label of labels.data.labels || []) {
    labelStats.push({
      name: label.name,
      id: label.id,
      messagesUnread: label.messagesUnread || 0,
      messagesTotal: label.messagesTotal || 0
    });
  }
  
  labelStats.sort((a, b) => b.messagesTotal - a.messagesTotal);
  labelStats.slice(0, 15).forEach(l => {
    console.log(`${l.name.padEnd(30)} | Total: ${String(l.messagesTotal).padStart(6)} | Unread: ${String(l.messagesUnread).padStart(4)}`);
  });
  
  // Discover top senders and spammy patterns
  console.log('\n=== DISCOVERING TOP SENDERS (sampling first 100 from inbox) ===');
  const messages = await gmail.users.messages.list({
    userId: 'me',
    q: 'in:inbox',
    maxResults: 100
  });
  
  const senderMap = {};
  for (const msg of messages.data.messages || []) {
    const fullMsg = await gmail.users.messages.get({
      userId: 'me',
      id: msg.id,
      format: 'metadata',
      metadataHeaders: ['From', 'Subject', 'Date']
    });
    
    const headers = fullMsg.data.payload.headers;
    const from = headers.find(h => h.name === 'From')?.value || 'UNKNOWN';
    const subject = headers.find(h => h.name === 'Subject')?.value || '(no subject)';
    
    if (!senderMap[from]) {
      senderMap[from] = { count: 0, subjects: [] };
    }
    senderMap[from].count += 1;
    if (senderMap[from].subjects.length < 3) {
      senderMap[from].subjects.push(subject.substring(0, 60));
    }
  }
  
  const senders = Object.entries(senderMap)
    .map(([from, data]) => ({ from, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
  
  console.log(`\nTotal unique senders in sample: ${Object.keys(senderMap).length}\n`);
  
  senders.forEach((s, i) => {
    console.log(`${i + 1}. ${s.from}`);
    console.log(`   Messages: ${s.count}`);
    console.log(`   Samples:`);
    s.subjects.forEach(subj => console.log(`     - ${subj}`));
  });
}

(async () => {
  try {
    const auth = await authenticate();
    console.log('✓ Autenticação bem-sucedida');
    await discoverEmails(auth);
  } catch (err) {
    console.error('✗ Erro:', err.message);
    process.exit(1);
  }
})();
