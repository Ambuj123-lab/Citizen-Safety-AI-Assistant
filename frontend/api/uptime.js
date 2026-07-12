export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // Try multiple variations of env variable name to be safe
        // Try multiple variations of env variable name to be safe
        const apiKey = process.env.UPTIMEROBOT_API_KEY || 
                       process.env.UPTIME_ROBOT_API_KEY || 
                       process.env.VITE_UPTIMEROBOT_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'UptimeRobot API Key missing in environment' });
        }

        const response = await fetch('https://api.uptimerobot.com/v2/getMonitors', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `api_key=${apiKey}&format=json&custom_uptime_ratios=30&response_times=1`
        });

        const data = await response.json();

        if (data.stat === 'ok' && data.monitors && data.monitors.length > 0) {
            // Find monitor that contains 'citizen', default to first monitor if not found
            const monitor = data.monitors.find(m => m.friendly_name.toLowerCase().includes('citizen')) || data.monitors[0];
            const isUp = monitor.status === 2; // 2 means up
            const ratio = parseFloat(monitor.custom_uptime_ratio).toFixed(1);
            const latency = (monitor.response_times && monitor.response_times.length > 0) ? monitor.response_times[0].value : null;
            
            return res.status(200).json({
                status: isUp ? 'operational' : 'down',
                uptime: isUp ? `${ratio}%` : 'DOWN',
                latency: latency ? `${latency}ms` : '--',
                monitorName: monitor.friendly_name
            });
        }

        return res.status(500).json({ error: 'Failed to parse UptimeRobot response', data });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
