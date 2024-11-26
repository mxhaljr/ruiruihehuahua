const db = require('../config/database');

class Anniversary {
    static async findAll(userId) {
        try {
            const [rows] = await db.execute(
                'SELECT * FROM anniversaries WHERE user_id = ?',
                [userId]
            );
            return rows;
        } catch (err) {
            console.error('数据库查询错误:', err);
            throw err;
        }
    }

    static async create(anniversaryData) {
        const { title, date, type, description, reminder_days, important, user_id } = anniversaryData;
        const [result] = await db.execute(
            'INSERT INTO anniversaries (title, date, type, description, reminder_days, important, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [title, date, type || 'other', description, reminder_days || 7, important || 0, user_id]
        );
        return { id: result.insertId, ...anniversaryData };
    }

    static async update(id, userId, anniversaryData) {
        const { title, date, type, description, reminder_days, important } = anniversaryData;
        const [result] = await db.execute(
            'UPDATE anniversaries SET title = ?, date = ?, type = ?, description = ?, reminder_days = ?, important = ? WHERE id = ? AND user_id = ?',
            [title, date, type || 'other', description, reminder_days || 7, important || 0, id, userId]
        );
        return result.affectedRows > 0;
    }

    static async delete(id, userId) {
        const [result] = await db.execute(
            'DELETE FROM anniversaries WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return result.affectedRows > 0;
    }

    static async findById(id, userId) {
        const [rows] = await db.execute(
            'SELECT * FROM anniversaries WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return rows[0];
    }

    static async findUpcoming(userId, days = 30) {
        const [rows] = await db.execute(
            `SELECT * FROM anniversaries 
             WHERE user_id = ? 
             AND DATEDIFF(date, CURDATE()) BETWEEN 0 AND ?
             ORDER BY date ASC`,
            [userId, days]
        );
        return rows;
    }

    static async findByMonth(userId, month) {
        const [rows] = await db.execute(
            `SELECT * FROM anniversaries 
             WHERE user_id = ? 
             AND MONTH(date) = ?
             ORDER BY date ASC`,
            [userId, month]
        );
        return rows;
    }
}

module.exports = Anniversary; 