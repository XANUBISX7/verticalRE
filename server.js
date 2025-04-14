const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '.'))); // Serve static files from current directory

// Salesforce Authentication endpoint
app.post('/api/auth', async (req, res) => {
    try {
        const { username, password, client_id, client_secret } = req.body;
        
        const response = await fetch('https://login.salesforce.com/services/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type: 'password',
                client_id,
                client_secret,
                username,
                password
            })
        });

        const data = await response.json();
        
        if (data.error) {
            return res.status(400).json({ error: data.error_description });
        }
        
        res.json(data);
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Salesforce Query endpoint
app.post('/api/query', async (req, res) => {
    try {
        const { instance_url, access_token, query } = req.body;
        
        const response = await fetch(`${instance_url}/services/data/v57.0/query?q=${encodeURIComponent(query)}`, {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        });

        const data = await response.json();
        
        if (data.error) {
            return res.status(400).json({ error: data.error_description });
        }
        
        res.json(data);
    } catch (error) {
        console.error('Query error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
}); 