-- 启用UUID扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 用户表
CREATE TABLE Users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    username VARCHAR(256) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 验证码表
CREATE TABLE VerificationCodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    type VARCHAR(20) NOT NULL,
    used BOOLEAN DEFAULT false,
    expiresAt TIMESTAMP WITH TIME ZONE NOT NULL,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 生日表
CREATE TABLE birthdays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES Users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    birth_date DATE NOT NULL,
    lunar BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT,
    reminder_days INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 纪念日类型表
CREATE TABLE anniversary_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 纪念日表
CREATE TABLE anniversaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES Users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'other' REFERENCES anniversary_types(name),
    description TEXT,
    reminder_days INTEGER DEFAULT 7,
    important BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 倒数日表
CREATE TABLE life_day (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES Users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    target_date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为所有表添加更新时间触发器
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON Users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_verification_codes_updated_at
    BEFORE UPDATE ON VerificationCodes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_birthdays_updated_at
    BEFORE UPDATE ON birthdays
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_anniversaries_updated_at
    BEFORE UPDATE ON anniversaries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_life_day_updated_at
    BEFORE UPDATE ON life_day
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 添加索引以提高查询性能
CREATE INDEX idx_users_email ON Users(email);
CREATE INDEX idx_users_username ON Users(username);
CREATE INDEX idx_verification_codes_email ON VerificationCodes(email);
CREATE INDEX idx_birthdays_user_id ON birthdays(user_id);
CREATE INDEX idx_anniversaries_user_id ON anniversaries(user_id);
CREATE INDEX idx_anniversaries_date ON anniversaries(date);
CREATE INDEX idx_anniversaries_type ON anniversaries(type);
CREATE INDEX idx_life_day_user_id ON life_day(user_id);

-- 设置行级安全策略
ALTER TABLE Users ENABLE ROW LEVEL SECURITY;
ALTER TABLE VerificationCodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE birthdays ENABLE ROW LEVEL SECURITY;
ALTER TABLE anniversaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE life_day ENABLE ROW LEVEL SECURITY;
ALTER TABLE anniversary_types ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "Users can view own data" ON Users
    FOR ALL
    USING (auth.uid() = id);

CREATE POLICY "Anyone can create verification code" ON VerificationCodes
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can view own birthdays" ON birthdays
    FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own anniversaries" ON anniversaries
    FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own life_day" ON life_day
    FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Everyone can read anniversary types" ON anniversary_types
    FOR SELECT
    TO public
    USING (true);

-- 添加纪念日类型数据
INSERT INTO anniversary_types (name, description) VALUES
('love', '恋爱纪念'),
('wedding', '结婚纪念'),
('work', '工作纪念'),
('other', '其他纪念'); 