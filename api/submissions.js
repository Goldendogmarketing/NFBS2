const { verifyAuth } = require('../lib/auth');
const { getAllSubmissions, createSubmission } = require('../lib/kv');

module.exports = async function handler(req, res) {
  // --- Admin GET: list all submissions (auth required) ---
  if (req.method === 'GET') {
    const user = verifyAuth(req);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    const submissions = await getAllSubmissions();
    return res.json(submissions);
  }

  // --- Public POST: new form submission ---
  if (req.method === 'POST') {
    try {
      const body = req.body;

      if (!body.name || !body.type) {
        return res.status(400).json({ error: 'Name and type are required.' });
      }
      if (!['rto', 'purchase', 'quote', 'promo'].includes(body.type)) {
        return res.status(400).json({ error: 'Invalid submission type.' });
      }
      if (['rto', 'purchase', 'quote'].includes(body.type) && !body.phone) {
        return res.status(400).json({ error: 'Phone is required for this submission type.' });
      }

      // Honeypot spam check
      if (body._honey) {
        return res.json({ success: true });
      }

      // Save to Redis
      const submission = await createSubmission({
        type: body.type,
        name: body.name,
        phone: body.phone,
        email: body.email || '',
        zip: body.zip || '',
        shed_name: body.shed_name || null,
        shed_price: body.shed_price || null,
        address: body.address || null,
        building_type: body.building_type || null,
        building_size: body.building_size || null,
        notes: body.notes || ''
      });

      // Forward to FormSubmit.co for email notification (fire-and-forget)
      var subjectMap = {
        rto: 'New Shed Rent-To-Own Application',
        purchase: 'New Shed Purchase Inquiry',
        quote: 'New Quote Request',
        promo: 'New Promo Signup'
      };

      var emailPayload = {
        Name: body.name,
        Phone: body.phone,
        Email: body.email || 'Not provided',
        'ZIP Code': body.zip || '',
        _subject: subjectMap[body.type],
        _template: 'table'
      };

      if (body.type === 'rto' || body.type === 'purchase') {
        emailPayload['Selected Shed'] = body.shed_name || '';
        emailPayload[body.type === 'rto' ? 'Monthly Payment' : 'Sale Price'] = body.shed_price || '';
        emailPayload['Delivery Address'] = body.address || '';
      }
      if (body.type === 'quote') {
        emailPayload['Building Type'] = body.building_type || '';
        emailPayload['Approximate Size'] = body.building_size || '';
      }
      if (body.type === 'promo') {
        emailPayload['Source'] = 'Landing Page Popup';
      }
      if (body.notes) {
        emailPayload['Notes'] = body.notes;
      }

      try {
        await fetch('https://formsubmit.co/ajax/info@nflbuildingsolutions.com', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(emailPayload)
        });
      } catch (emailErr) {
        console.error('FormSubmit email error:', emailErr.message);
      }

      return res.json({ success: true, id: submission.id });
    } catch (err) {
      return res.status(500).json({ error: 'Submission failed.' });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
};
