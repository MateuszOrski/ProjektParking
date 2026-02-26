const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

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
                ps.user_id,
                ps.total_cost,
                CASE 
                    WHEN ps.payment_status = 'UNPAID' THEN 'OCCUPIED' 
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

app.get('/api/spots/:user_id', async (req, res) => {
    const { user_id } = req.params;

    try {
        const sql = `
            SELECT * FROM parking_sessions 
            WHERE user_id = ? 
            AND payment_status = 'UNPAID'
            ORDER BY entry_time DESC
        `;
        const [sessions] = await promiseDb.query(sql, [user_id]);
        res.json({
            success: true,
            sessions: sessions
        });
    } catch (err) {
        console.error('Błąd pobierania miejsc użytkownika:', err);
        res.status(500).json({ success: false, message: 'Błąd serwera' });
    }
});

app.post('/api/entry', async (req, res) => {
    const { spot_id, plate_number, duration_hours, user_id} = req.body;
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
            (spot_id, plate_number, payment_token, payment_status, entry_time, exit_time, user_id) 
            VALUES (?, ?, ?, 'UNPAID', NOW(), DATE_ADD(NOW(), INTERVAL ? HOUR), ?)`,
            [spot_id, plate_number, token, duration, user_id]
        );

        res.json({ 
            success: true, 
            message: `Wjazd udany. Bilet ważny przez ${duration}h.`,
            token: token
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Błąd podczas wjazdu' });
    }
});
app.get('/api/get-ticket/:token', async (req, res) => {
    const { token } = req.params;

    try {
        const sql = 'SELECT * FROM parking_sessions WHERE payment_token = ?';
        const [tickets] = await promiseDb.query(sql, [token]);

        if (tickets.length === 0) {
            return res.status(404).json({ success: false, message: 'Nie znaleziono biletu o podanym tokenie' });
        }

        const ticket = tickets[0];
        res.json({
            success: true,
            ticket: {
                id: ticket.id,
                spot_id: ticket.spot_id,
                plate_number: ticket.plate_number,
                entry_time: ticket.entry_time,
                exit_time: ticket.exit_time,
                total_cost: ticket.total_cost,
                payment_status: ticket.payment_status
            }
        });
    } catch (err) {
        console.error('Błąd pobierania biletu:', err);
        res.status(500).json({ success: false, message: 'Błąd serwera' });
    }
});



app.post('/api/exit', async (req, res) => {
    const { spot_id, price, user_id } = req.body;
    try {
        const balance = await promiseDb.query("SELECT balance FROM auth_db.users WHERE id = ?", [user_id]);
        if (balance[0][0].balance < price) {
            return res.status(400).json({ success: false, message: 'Niewystarczające środki na koncie!' });
        }
        await promiseDb.query(
            'UPDATE parking_sessions SET exit_time = NOW(), total_cost = ?, payment_status = "PAID" WHERE spot_id = ?',
            [price, spot_id]
        );
        await promiseDb.query(
            'UPDATE auth_db.users SET balance = balance - ? WHERE id = ?',
            [price, user_id]
        );
        res.json({ success: true, message: 'Wyjazd zarejestrowany.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Błąd wyjazdu' });
    }
});

app.get('/api/history/:user_id', async (req, res) => {
    const { user_id } = req.params;

    try {
        const sql = `
            SELECT s.id AS spot_id,
                s.spot_number,
                s.floor,
                ps.plate_number,
                ps.entry_time AS start_time,
                ps.exit_time AS end_time,
                ps.payment_status,
                ps.total_cost
            FROM parking_sessions ps
            JOIN spots s
                ON s.id = ps.spot_id
            WHERE ps.user_id = ?
            AND ps.payment_status = 'PAID'
            ORDER BY ps.entry_time DESC;
        `;
        
        const [history] = await promiseDb.query(sql, [user_id]);

        res.json({
            count: history.length,
            history: history
        });

    } catch (err) {
        console.log
        res.status(500).json({ message: 'Błąd pobierania historii' });
    }
});

app.get('/api/spot-history/:spot_id', async (req, res) => {
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
                    lastName: user.last_name,
                    balance: user.balance
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

app.get('/api/session/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const sql = `
            SELECT 
                ps.*, 
                s.spot_number, 
                s.floor 
            FROM parking_sessions ps
            LEFT JOIN spots s ON ps.spot_id = s.id
            WHERE ps.id = ?
        `;

        const [results] = await promiseDb.query(sql, [id]);

        if (results.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Nie znaleziono parkowania o podanym ID' 
            });
        }

        res.json({
            success: true,
            session: results[0]
        });

    } catch (err) {
        console.error('Błąd pobierania sesji:', err);
        res.status(500).json({ success: false, message: 'Błąd serwera' });
    }
});

app.get('/api/analyze-random', async (req, res) => {
    try {
        const imagesDir = path.join(__dirname, 'cars_images');
        
        if (!fs.existsSync(imagesDir)) {
            return res.status(500).json({ message: 'Brak folderu cars_images' });
        }
        
        const files = fs.readdirSync(imagesDir).filter(file => file.endsWith('.png') || file.endsWith('.jpg'));
        
        if (files.length === 0) {
            return res.status(404).json({ message: 'Brak zdjęć w folderze' });
        }

        const randomFile = files[Math.floor(Math.random() * files.length)];
        const filePath = path.join(imagesDir, randomFile);

        console.log(`Wybrano losowo plik: ${randomFile}`);

        const form = new FormData();
        form.append('file', fs.createReadStream(filePath));

        const lprUrl = 'http://lpr:8000/predict'; 

        const lprResponse = await axios.post(lprUrl, form, {
            headers: {
                ...form.getHeaders()
            }
        });

        const imageBitmap = fs.readFileSync(filePath);
        const imageBase64 = imageBitmap.toString('base64');
        const mimeType = randomFile.endsWith('.png') ? 'image/png' : 'image/jpeg';

        res.json({
            success: true,
            filename: randomFile,
            analysis: lprResponse.data, 
            image: `data:${mimeType};base64,${imageBase64}` 
        });

    } catch (err) {
        console.error('Błąd analizy:', err.message);
        res.status(500).json({ 
            success: false, 
            message: 'Błąd połączenia z serwerem rozpoznawania tablic',
            error: err.message
        });
    }
});


function calculateParkingCost(hours) {
    let cost = 0;
    const h = parseInt(hours) || 0;

    for (let i = 1; i <= h; i++) {
        if (i === 1) cost += 5;
        else if (i === 2) cost += 10;
        else if (i === 3) cost += 15;
        else cost += 20;
    }
    return cost;
}

app.get('/api/calculate-price/:hours', (req, res) => {
    const hours = req.params.hours;
    const price = calculateParkingCost(hours);
    res.json({ hours, price, currency: 'PLN' });
});

app.listen(3000, () => {
    console.log('Serwer Parkometru działa na porcie 3000');
});

app.get('/api/user/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const sql = 'SELECT id, login, role, first_name, last_name, balance FROM auth_db.users WHERE id = ?';
        const [users] = await promiseDb.query(sql, [id]);

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'Nie znaleziono użytkownika o podanym ID' });
        }

        const user = users[0];
        res.json({
            success: true,
            user: {
                id: user.id,
                login: user.login,
                role: user.role,
                firstName: user.first_name,
                lastName: user.last_name,
                balance: user.balance
            }
        });
    } catch (err) {
        console.error('Błąd pobierania użytkownika:', err);
        res.status(500).json({ success: false, message: 'Błąd serwera' });
    }
});

app.get('/api/history/:user_id', async (req, res) => {
    const { user_id } = req.params;

    try {
        const sql = `
            SELECT 
                ps.*, 
                s.spot_number, 
                s.floor 
            FROM parking_sessions ps
            LEFT JOIN spots s ON ps.spot_id = s.id
            WHERE ps.user_id = ?
            ORDER BY ps.entry_time DESC;
        `;
        const [sessions] = await promiseDb.query(sql, [user_id]);
        res.json({
            success: true,
            sessions: sessions
        });
    } catch (err) {
        console.error('Błąd pobierania miejsc użytkownika:', err);
        res.status(500).json({ success: false, message: 'Błąd serwera' });
    }
});


app.get('/admin/get-all-users', async (req, res) => {  
    try {
        const sql = 'SELECT id, login, role, first_name, last_name, balance FROM auth_db.users';
        const [users] = await promiseDb.query(sql);
        res.json({
            success: true,
            users: users
        });
    } catch (err) {
        console.error('Błąd pobierania użytkowników:', err);
        res.status(500).json({ success: false, message: 'Błąd serwera' });
    }
});

app.post('/admin/charge-user', async (req, res) => {
    const { user_id, amount } = req.body;

    if (!user_id || !amount) {
        return res.status(400).json({ success: false, message: 'Brak user_id lub amount' });
    }

    try {
        await promiseDb.query(
            'UPDATE auth_db.users SET balance = balance + ? WHERE id = ?',
            [amount, user_id]
        );
        res.json({ success: true, message: `Doładowano konto użytkownika o ${amount} PLN` });
    } catch (err) {
        console.error('Błąd doładowania konta użytkownika:', err);
        res.status(500).json({ success: false, message: 'Błąd serwera' });
    }
});

app.post('/admin/add-user', async (req, res) => {
    const { login, password, role, first_name, last_name } = req.body;
    if (!login || !password || !role || !first_name || !last_name) {
        return res.status(400).json({ success: false, message: 'Brak danych do utworzenia użytkownika' });
    }

    try {
        const sql = 'INSERT INTO auth_db.users (login, password, role, first_name, last_name) VALUES (?, ?, ?, ?, ?)';
        await promiseDb.query(sql, [login, password, role, first_name, last_name]);
        res.json({ success: true, message: 'Użytkownik dodany pomyślnie' });
    } catch (err) {
        console.error('Błąd dodawania użytkownika:', err);
        res.status(500).json({ success: false, message: 'Błąd serwera' });
    }
});