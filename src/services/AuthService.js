import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export class AuthService {
    async register(userData) {
        const user = await User.create(userData);
        return this.generateToken(user);
    }

    async login(credentials) {
        const user = await User.findOne({ where: { email: credentials.email } });
        if (!user || !await bcrypt.compare(credentials.password, user.password)) {
            throw new Error('Invalid credentials');
        }
        return this.generateToken(user);
    }

    generateToken(user) {
        return jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
    }
}