const db = require('../config/database');

class Countdown {
    static async findAll(userId) {
        try {
            const [rows] = await db.execute(
                'SELECT * FROM life_day WHERE user_id = ? ORDER BY target_date ASC',
                [userId]
            );
            return rows;
        } catch (err) {
            console.error('数据库查询错误:', err);
            throw err;
        }
    }

    static async create(countdownData) {
        const { title, target_date, description, user_id } = countdownData;
        const [result] = await db.execute(
            'INSERT INTO life_day (title, target_date, description, user_id) VALUES (?, ?, ?, ?)',
            [title, target_date, description, user_id]
        );
        return { id: result.insertId, ...countdownData };
    }

    static async update(id, userId, countdownData) {
        const { title, target_date, description } = countdownData;
        const [result] = await db.execute(
            'UPDATE life_day SET title = ?, target_date = ?, description = ? WHERE id = ? AND user_id = ?',
            [title, target_date, description, id, userId]
        );
        return result.affectedRows > 0;
    }

    static async delete(id, userId) {
        const [result] = await db.execute(
            'DELETE FROM life_day WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return result.affectedRows > 0;
    }

    static async findById(id, userId) {
        const [rows] = await db.execute(
            'SELECT * FROM life_day WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return rows[0];
    }

    static async findUpcoming(userId, days = 30) {
        const [rows] = await db.execute(
            `SELECT * FROM life_day 
             WHERE user_id = ? 
             AND DATEDIFF(target_date, CURDATE()) BETWEEN 0 AND ?
             ORDER BY target_date ASC`,
            [userId, days]
        );
        return rows;
    }

    static async findPast(userId) {
        const [rows] = await db.execute(
            `SELECT * FROM life_day 
             WHERE user_id = ? 
             AND target_date <= CURDATE()
             ORDER BY target_date DESC`,
            [userId]
        );
        return rows;
    }

    static async findFuture(userId) {
        const [rows] = await db.execute(
            `SELECT * FROM life_day 
             WHERE user_id = ? 
             AND target_date > CURDATE()
             ORDER BY target_date ASC`,
            [userId]
        );
        return rows;
    }
}

module.exports = Countdown; 