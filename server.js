const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Salesforce credentials
const SF_CREDENTIALS = {
    client_id: '3MVG9HxRZv05HarSVQTVEemG9FwGRw.kvwiYNqCNOgazF2lMc7rQx5gt.aiMZWn5Wd5F_eN.3wPHYtStIp5ib',
    client_secret: 'CE2F1A590D250CADCF6738B9B5DCC3CACBEE427FC4FF9F270DB8F289E9BFD55D',
    username: 'mina.real@gmail.com',
    password: 'salesforce@123'
};

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '.')));

// Salesforce Authentication endpoint
app.post('/api/auth', async (req, res) => {
    try {
        const response = await fetch('https://login.salesforce.com/services/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type: 'password',
                client_id: SF_CREDENTIALS.client_id,
                client_secret: SF_CREDENTIALS.client_secret,
                username: SF_CREDENTIALS.username,
                password: SF_CREDENTIALS.password
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error('Salesforce auth error:', data);
            return res.status(response.status).json({
                error: data.error,
                error_description: data.error_description
            });
        }

        res.json(data);
    } catch (error) {
        console.error('Server auth error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Salesforce Query endpoint
app.post('/api/query', async (req, res) => {
    try {
        const { instance_url, access_token, query } = req.body;
        
        const response = await fetch(`${instance_url}/services/data/v57.0/query?q=${encodeURIComponent(query)}`, {
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error('Salesforce query error:', data);
            return res.status(response.status).json({
                error: data[0]?.errorCode,
                message: data[0]?.message
            });
        }

        res.json(data);
    } catch (error) {
        console.error('Server query error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
}); 