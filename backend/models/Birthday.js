const db = require('../config/database');

class Birthday {
    static async findAll(userId) {
        try {
            console.log('执行查询, userId:', userId);
            const [rows] = await db.execute(
                'SELECT * FROM birthdays WHERE user_id = ?',
                [userId]
            );
            console.log('查询结果:', rows);
            return rows;
        } catch (err) {
            console.error('数据库查询错误:', err);
            throw err;
        }
    }

    static async create(birthdayData) {
        const { name, birth_date, description, reminder_days, lunar, user_id } = birthdayData;
        const [result] = await db.execute(
            'INSERT INTO birthdays (name, birth_date, description, reminder_days, lunar, user_id) VALUES (?, ?, ?, ?, ?, ?)',
            [name, birth_date, description, reminder_days || 0, lunar || 0, user_id]
        );
        return { id: result.insertId, ...birthdayData };
    }

    static async update(id, userId, birthdayData) {
        const { name, birth_date, description, reminder_days, lunar } = birthdayData;
        const [result] = await db.execute(
            'UPDATE birthdays SET name = ?, birth_date = ?, description = ?, reminder_days = ?, lunar = ? WHERE id = ? AND user_id = ?',
            [name, birth_date, description, reminder_days || 0, lunar || 0, id, userId]
        );
        return result.affectedRows > 0;
    }

    static async delete(id, userId) {
        const [result] = await db.execute(
            'DELETE FROM birthdays WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return result.affectedRows > 0;
    }

    static async findById(id, userId) {
        const [rows] = await db.execute(
            'SELECT * FROM birthdays WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return rows[0];
    }
}

module.exports = Birthday; 