const { verifyAuth } = require('../lib/auth');
const { getAllSubmissions, createSubmission, getPromoPopup } = require('../lib/kv');
const { encrypt } = require('../lib/crypto');

module.exports = async function handler(req, res) {
  // --- Public GET: promo popup config (no auth) ---
  if (req.method === 'GET' && req.query.promo === '1') {
    try {
      const promo = await getPromoPopup();
      if (!promo || !promo.enabled) {
        return res.json({ enabled: false });
      }
      return res.json({
        enabled: true,
        headline: promo.headline,
        description: promo.description,
        discount_text: promo.discount_text,
        button_text: promo.button_text,
        bg_color: promo.bg_color,
        delay_seconds: promo.delay_seconds || 4
      });
    } catch (err) {
      return res.json({ enabled: false });
    }
  }

  // --- Admin GET: list all submissions (auth required) ---
  if (req.method === 'GET') {
    const user = verifyAuth(req);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    try {
      const submissions = await getAllSubmissions();
      return res.json(submissions);
    } catch (err) {
      return res.status(500).json({ error: 'Failed to load submissions.' });
    }
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

      // Build submission data
      var submissionData = {
        type: body.type,
        name: body.name,
        phone: body.phone || '',
        email: body.email || '',
        zip: body.zip || '',
        shed_name: body.shed_name || null,
        shed_price: body.shed_price || null,
        address: body.address || null,
        building_type: body.building_type || null,
        building_size: body.building_size || null,
        notes: body.notes || ''
      };

      // RTO-specific fields
      if (body.type === 'rto') {
        submissionData.first_name = body.first_name || '';
        submissionData.middle_name = body.middle_name || '';
        submissionData.last_name = body.last_name || '';
        submissionData.dob = body.dob || '';
        try {
          submissionData.ssn_encrypted = body.ssn ? encrypt(body.ssn) : '';
          submissionData.dl_encrypted = body.drivers_license ? encrypt(body.drivers_license) : '';
        } catch (encErr) {
          console.error('Encryption error:', encErr.message);
          return res.status(500).json({ error: 'Failed to secure your data. Please try again or call (386) 350-1047.' });
        }
      }

      // Save to Redis
      const submission = await createSubmission(submissionData);

      // Forward to FormSubmit.co for email notification (fire-and-forget)
      var subjectMap = {
        rto: 'New Shed Rent-To-Own Application',
        purchase: 'New Shed Purchase Inquiry',
        quote: 'New Quote Request',
        promo: 'New Promo Signup'
      };

      var emailPayload = {
        Name: body.name,
        Phone: body.phone || 'N/A',
        Email: body.email || 'Not provided',
        'ZIP Code': body.zip || '',
        _subject: subjectMap[body.type],
        _template: 'table'
      };

      if (body.type === 'rto') {
        emailPayload['Full Name'] = (body.first_name || '') + ' ' + (body.middle_name ? body.middle_name + ' ' : '') + (body.last_name || '');
        emailPayload['Date of Birth'] = body.dob || '';
        emailPayload['SSN'] = body.ssn ? '***-**-' + body.ssn.slice(-4) : '';
        emailPayload["Driver's License"] = body.drivers_license ? '****' + body.drivers_license.slice(-4) : '';
        emailPayload['Selected Shed'] = body.shed_name || '';
        emailPayload['Monthly Payment'] = body.shed_price || '';
        emailPayload['Delivery Address'] = body.address || '';
      }
      if (body.type === 'purchase') {
        emailPayload['Selected Shed'] = body.shed_name || '';
        emailPayload['Sale Price'] = body.shed_price || '';
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
        await fetch('https://formsubmit.co/ajax/northfloridabuildingsolutions@outlook.com', {
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
