require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 10000; // Updated to use Render's default port

// Load credentials from environment variables
const consumerKey = process.env.CONSUMER_KEY;
const consumerSecret = process.env.CONSUMER_SECRET;
const shortCode = process.env.SHORT_CODE;
const passKey = process.env.PASS_KEY;
const confirmationUrl = process.env.CONFIRMATION_URL; // Ensure this URL does not contain "MPESA"
const validationUrl = process.env.VALIDATION_URL;   // Ensure this URL does not contain "MPESA"

// Generate access token
const generateAccessToken = async () => {
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  try {
    const response = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });
    console.log('Access Token:', response.data.access_token); // Log the token
    return response.data.access_token;
  } catch (error) {
    console.error('Error generating access token:', error.response ? error.response.data : error.message);
    throw error;
  }
};

// Register URL
app.post('/register-url', async (req, res) => {
  const accessToken = await generateAccessToken();
  const url = 'https://sandbox.safaricom.co.ke/mpesa/c2b/v1/registerurl';
  const data = {
    ShortCode: shortCode,
    ResponseType: 'Completed',
    ConfirmationURL: confirmationUrl, // Use environment variable
    ValidationURL: validationUrl,     // Use environment variable
  };
  console.log('Register URL Payload:', data); // Log the payload
  try {
    const response = await axios.post(url, data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error registering URL:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to register URL' });
  }
});

// Simulate C2B Payment
app.post('/c2b-payment', async (req, res) => {
  const { amount, phoneNumber, reference } = req.body;

  // Validate request body
  if (!amount || !phoneNumber || !reference) {
    console.error('Invalid request body:', req.body);
    return res.status(400).json({ error: 'Missing required fields: amount, phoneNumber, reference' });
  }

  const accessToken = await generateAccessToken();
  const url = 'https://sandbox.safaricom.co.ke/mpesa/c2b/v1/simulate';
  const data = {
    ShortCode: shortCode,
    CommandID: 'CustomerPayBillOnline',
    Amount: amount,
    Msisdn: phoneNumber,
    BillRefNumber: reference,
  };
  console.log('C2B Payment Payload:', data); // Log the payload
  try {
    const response = await axios.post(url, data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error simulating C2B payment:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to simulate C2B payment' });
  }
});

// Confirmation URL endpoint
app.post('/confirmation', (req, res) => {
  console.log('Confirmation request received:', req.body);
  res.status(200).json({ message: 'Confirmation received successfully' });
});

// Validation URL endpoint
app.post('/validation', (req, res) => {
  console.log('Validation request received:', req.body);
  res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' }); // Safaricom expects this format
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});