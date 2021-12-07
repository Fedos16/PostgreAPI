const db = require('../db');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { text } = require('express');

const saltRounds = 8;

const functions = {};

functions.signup = async function(req, res) {
    try {
        const { access_level_id, login, password, name } = req.body;

        const salt = await bcrypt.genSalt(saltRounds);
        const hash = await bcrypt.hash(password, salt);
        const token = crypto.randomBytes(53).toString('hex');
        const reg_date = new Date();

        await db.query(
            'INSERT INTO users (id, token, reg_date, access_level_id, login, password, salt, name) values ($1, $2, $3, $4, $5, $6, $7, $8)', 
            [ uuidv4(), token, reg_date, access_level_id, login, hash, salt, name ]
        );
        
        res.json({ ok: true });
    } catch(e) {
        console.log(e);
        res.json({ ok: false, text: 'Сервер временно недоступен' });
    }
}
functions.signin = async function(req, res) {
    try {
        const { login, password } = req.body;

        const user = await db.query('SELECT password, salt, token FROM users WHERE login = $1', [ login ]);
        if (user.rows.length > 0) {

            const token = user.rows[0].token;

            let salt = user.rows[0].salt;
            let hash = await bcrypt.hash(password, salt);

            const passwordFromDb = user.rows[0].password;

            if (passwordFromDb == hash) {
                res.json({ ok: true, token });
            } else {
                res.json({ ok: false, text: 'Неверный пароль' });
            }

        } else {
            res.json({ ok: false, text: 'Пользователь не найден' });
        }
    } catch(e) {
        console.log(e);
        res.json({ ok: false, text: 'Сервер временно недоступен' });
    }
}
functions.events = async function(req, res) {
    try {
        const { token, location, date, time, category, type, filter_confirmed, filter_important, filter_removed } = req.body;

        const user = await db.query('SELECT login FROM users WHERE token = $1', [ token ]);
        if (user.rowCount == 0) {
            res.json({ ok: false, text: 'Доступ запрещен' });
            return;
        }

        let dates = date.split('-');
        let times = time.split('-');

        let start = dates[0] + ' ' + times[0];
        let end;
        if (dates.length > 1 || times.length > 1) {
            (dates.length > 1) ? end = dates[1] : end = dates[0];
            (times.length > 1) ? end += ' ' + times[1] : end += ' ' + times[0];
        }

        let numParams = 1;
        let queryString = 'SELECT * FROM events WHERE (location_id = $1)';
        let params = [location];

        if (end) {
            queryString += ` and (time between $2 and $3)`;
            params.push(start);
            params.push(end);
            numParams = 3;
        } else {
            queryString += ` and (time = $2)`;
            params.push(start);
            numParams = 2;
        }

        if (category) {
            queryString += ` and (category_id = $${numParams + 1})`;
            params.push(category);
            numParams ++;
        }

        if (type) {
            queryString += ` and (type_id = $${numParams + 1})`;
            params.push(type);
            numParams ++;
        }

        if (filter_confirmed) {
            queryString += ` and (is_confirmed = $${numParams + 1})`;
            params.push(filter_confirmed);
            numParams ++;
        }

        if (filter_important) {
            queryString += ` and (is_important = $${numParams + 1})`;
            params.push(filter_important);
            numParams ++;
        }

        if (filter_removed) {
            queryString += ` and (is_removed = $${numParams + 1})`;
            params.push(filter_removed);
        } else {
            queryString += ` and (is_removed IS NULL)`;
        }
        

        console.log(queryString);
        console.log(params);

        let events = await db.query(queryString, params);

        res.json({ ok: true, events: events.rows });
    } catch(e) {
        console.log(e);
        res.json({ ok: false, text: 'Сервер временно недоступен' });
    }
}

module.exports = functions;