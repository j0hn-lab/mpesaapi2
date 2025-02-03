require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// Load credentials from environment variables
const consumerKey = process.env.CONSUMER_KEY;
const consumerSecret = process.env.CONSUMER_SECRET;
const shortCode = process.env.SHORT_CODE;
const passKey = process.env.PASS_KEY;

// Generate access token
const generateAccessToken = async () => {
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  try {
    const response = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });
    return response.data.access_token;
  } catch (error) {
    console.error('Error generating access token:', error);
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
    ConfirmationURL: 'https://nevadablue-1.onrender.com/confirmation', // Updated URL
    ValidationURL: 'https://nevadablue-1.onrender.com/validation',     // Updated URL
  };
  try {
    const response = await axios.post(url, data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error registering URL:', error);
    res.status(500).json({ error: 'Failed to register URL' });
  }
});

// Handle C2B payment
app.post('/c2b-payment', async (req, res) => {
  const accessToken = await generateAccessToken();
  const url = 'https://sandbox.safaricom.co.ke/mpesa/c2b/v1/simulate';
  const data = {
    ShortCode: shortCode,
    CommandID: 'CustomerPayBillOnline',
    Amount: req.body.amount,
    Msisdn: req.body.phoneNumber,
    BillRefNumber: req.body.reference,
  };
  try {
    const response = await axios.post(url, data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error simulating C2B payment:', error);
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
  res.status(200).json({ message: 'Validation successful' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});