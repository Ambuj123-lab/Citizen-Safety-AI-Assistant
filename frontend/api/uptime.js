export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // Try multiple variations of env variable name to be safe
        const apiKey = process.env.UPTIMEROBOT_API_KEY || process.env.UPTIME_ROBOT_API_KEY || process.env.VITE_UPTIMEROBOT_API_KEY;
        
        if (!apiKey) {
            return res.status(500).json({ error: 'UptimeRobot API Key missing in environment' });
        }

        const response = await fetch('https://api.uptimerobot.com/v2/getMonitors', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `api_key=${apiKey}&format=json&custom_uptime_ratios=30`
        });

        const data = await response.json();

        if (data.stat === 'ok' && data.monitors && data.monitors.length > 0) {
            const monitor = data.monitors[0];
            const isUp = monitor.status === 2; // 2 means up
            const ratio = parseFloat(monitor.custom_uptime_ratio).toFixed(1);
            
            return res.status(200).json({
                status: isUp ? 'operational' : 'down',
                uptime: isUp ? `${ratio}%` : 'DOWN',
                monitorName: monitor.friendly_name
            });
        }

        return res.status(500).json({ error: 'Failed to parse UptimeRobot response', data });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
