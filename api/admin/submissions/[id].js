const { verifyAuth } = require('../../../lib/auth');
const { getAllSubmissions, updateSubmissionStatus, deleteSubmission } = require('../../../lib/kv');
const { decrypt } = require('../../../lib/crypto');

module.exports = async function handler(req, res) {
  const user = verifyAuth(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const all = await getAllSubmissions();
      const submission = all.find(function(s) { return String(s.id) === String(id); });
      if (!submission) return res.status(404).json({ error: 'Submission not found' });

      var result = Object.assign({}, submission);
      if (result.ssn_encrypted) {
        try { result.ssn = decrypt(result.ssn_encrypted); } catch(e) { result.ssn = ''; }
      }
      if (result.dl_encrypted) {
        try { result.drivers_license = decrypt(result.dl_encrypted); } catch(e) { result.drivers_license = ''; }
      }
      return res.json(result);
    } catch (err) {
      return res.status(500).json({ error: 'Failed to load submission.' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const { status } = req.body;
      if (!['new', 'contacted', 'closed'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status.' });
      }
      const updated = await updateSubmissionStatus(id, status);
      if (!updated) return res.status(404).json({ error: 'Submission not found' });
      return res.json({ success: true, status: updated.status });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const deleted = await deleteSubmission(id);
      if (!deleted) return res.status(404).json({ error: 'Submission not found' });
      return res.json({ success: true });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
};
