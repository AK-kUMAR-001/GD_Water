const testSms = async () => {
  try {
    const res = await fetch('https://textbelt.com/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        number: '+918925081899',
        message: 'Neer Ugam: Grievance AQ-1008 (Broken Public Tap) registered. AI auto-routed to Ward 61.',
        key: 'textbelt'
      })
    });
    const data = await res.json();
    console.log('Textbelt response:', data);
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
};

testSms();
