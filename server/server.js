const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost', 
    
    port: process.env.DB_PORT || 3307, 
    
    user: 'root',
    password: process.env.DB_PASSWORD || 'rootpassword', 
    database: 'parking_db',   
    waitForConnections: true,
    connectionLimit: 10
});

const promiseDb = db.promise();

db.getConnection((err, conn) => {
    if (err) {
        console.error('BŁĄD POŁĄCZENIA Z BAZĄ:', err.message);
    } else {
        console.log(`SUKCES: Połączono z bazą ${process.env.DB_HOST || 'localhost'} na porcie ${process.env.DB_PORT || 3307}`);
        conn.release();
    }
});

app.get('/api/parking-status', async (req, res) => {
    try {
        const sql = `
            SELECT 
                s.id AS spot_id,
                s.spot_number,
                s.floor,
                ps.plate_number,
                ps.entry_time AS start_time,
                ps.exit_time AS end_time,
                CASE 
                    WHEN ps.id IS NOT NULL THEN 'OCCUPIED' 
                    ELSE 'FREE' 
                END AS status
            FROM spots s
            LEFT JOIN parking_sessions ps 
                ON s.id = ps.spot_id AND ps.exit_time > NOW()
            ORDER BY s.floor, s.id;
        `;

        const [results] = await promiseDb.query(sql);

        const total = results.length;
        const occupied = results.filter(r => r.status === 'OCCUPIED').length;
        const free = total - occupied;

        res.json({
            summary: { total, occupied, free },
            spots: results
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Błąd pobierania danych' });
    }
});

app.post('/api/entry', async (req, res) => {
    const { spot_id, plate_number, duration_hours } = req.body;
    const duration = duration_hours || 1; 

    if (!spot_id || !plate_number) {
        return res.status(400).json({ message: 'Brak danych wjazdu' });
    }

    try {
        const [existing] = await promiseDb.query(
            'SELECT * FROM parking_sessions WHERE spot_id = ? AND exit_time > NOW()',
            [spot_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'Miejsce jest nadal opłacone i zajęte!' });
        }

        const token = `ticket-${Date.now()}`;
        
        await promiseDb.query(
            `INSERT INTO parking_sessions 
            (spot_id, plate_number, payment_token, payment_status, entry_time, exit_time) 
            VALUES (?, ?, ?, 'PAID', NOW(), DATE_ADD(NOW(), INTERVAL ? HOUR))`,
            [spot_id, plate_number, token, duration]
        );

        res.json({ 
            success: true, 
            message: `Wjazd udany. Bilet ważny przez ${duration}h.`
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Błąd podczas wjazdu' });
    }
});

app.post('/api/exit', async (req, res) => {
    const { spot_id } = req.body;
    try {
        await promiseDb.query(
            'UPDATE parking_sessions SET exit_time = NOW() WHERE spot_id = ? AND exit_time > NOW()',
            [spot_id]
        );
        res.json({ success: true, message: 'Wyjazd zarejestrowany (czas skrócony).' });
    } catch (err) {
        res.status(500).json({ message: 'Błąd wyjazdu' });
    }
});

app.get('/api/history/:spot_id', async (req, res) => {
    const { spot_id } = req.params;

    try {
        const sql = `
            SELECT plate_number, entry_time, exit_time, payment_status 
            FROM parking_sessions 
            WHERE spot_id = ? 
            ORDER BY entry_time DESC
        `;
        
        const [history] = await promiseDb.query(sql, [spot_id]);

        res.json({
            spot_id: spot_id,
            count: history.length,
            history: history
        });

    } catch (err) {
        res.status(500).json({ message: 'Błąd pobierania historii' });
    }
});

app.get('/api/stats', async (req, res) => {
    try {
        const sql = `
            SELECT 
                s.spot_number, 
                s.floor,
                COUNT(ps.id) as count
            FROM spots s
            LEFT JOIN parking_sessions ps 
                ON s.id = ps.spot_id 
                AND DATE(ps.entry_time) = CURDATE()
            GROUP BY s.id, s.spot_number, s.floor
            ORDER BY count DESC, s.spot_number ASC;
        `;

        const [stats] = await promiseDb.query(sql);

        res.json({
            date: new Date().toISOString().split('T')[0],
            data: stats
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Błąd pobierania statystyk' });
    }
});

app.post('/login', async (req, res) => {
    const { login, password } = req.body;

    if (!login || !password) {
        return res.status(400).json({ success: false, message: 'Brak loginu lub hasła' });
    }

    try {
        const sql = 'SELECT * FROM auth_db.users WHERE login = ?';
        const [users] = await promiseDb.query(sql, [login]);

        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Nieprawidłowy login lub hasło' });
        }

        const user = users[0];

        if (password === user.password) {
            res.json({
                success: true,
                message: 'Zalogowano pomyślnie',
                user: {
                    id: user.id,
                    login: user.login,
                    role: user.role, 
                    firstName: user.first_name,
                    lastName: user.last_name
                }
            });
        } else {
            res.status(401).json({ success: false, message: 'Nieprawidłowy login lub hasło' });
        }

    } catch (err) {
        console.error('Błąd logowania:', err);
        res.status(500).json({ success: false, message: 'Błąd serwera podczas logowania' });
    }
});

app.listen(3000, () => {
    console.log('🚀 Serwer Parkometru działa na porcie 3000');
});