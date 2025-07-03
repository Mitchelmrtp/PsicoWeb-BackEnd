import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/UserRepository.js';
import { createSuccessResponse, createErrorResponse } from '../utils/responseUtils.js';

const dataFilePath = path.resolve('data', 'resetTokens.json');

export class PasswordService {
    constructor() {
        this.userRepository = new UserRepository();
    }
    
    async forgotPassword(email) {
        try {
            if (!email) {
                throw createErrorResponse('Email is required', 400);
            }
            
            const user = await this.userRepository.findByEmail(email);
            
            if (!user) {
                console.log(`❌ Forgot password attempt: email not found -> ${email}`);
                throw createErrorResponse('Email not found in our records', 404);
            }
            
            const token = jwt.sign(
                { userId: user.id },
                process.env.JWT_SECRET,
                { expiresIn: '15m' }
            );
            
            const resetData = await this.loadResetTokens();
            resetData.push({
                id: uuidv4(),
                userId: user.id,
                token,
                createdAt: new Date()
            });
            
            await fs.mkdir(path.dirname(dataFilePath), { recursive: true });
            await fs.writeFile(dataFilePath, JSON.stringify(resetData, null, 2));
            
            const recoveryLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;
            
            console.log('🔐 Password recovery requested successfully:', {
                message: 'Recovery email sent',
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                },
                recoveryLink
            });
            
            return createSuccessResponse({
                message: 'Recovery email sent successfully',
                recoveryLink // Only for development/testing
            });
        } catch (error) {
            if (error.statusCode) throw error;
            throw createErrorResponse('Error processing password recovery request', 500, error.message);
        }
    }
    
    async validateResetToken(token) {
        try {
            if (!token) {
                throw createErrorResponse('Reset token is required', 400);
            }
            
            // Verify JWT token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Check if token exists in our storage
            const resetData = await this.loadResetTokens();
            const tokenRecord = resetData.find(record => record.token === token);
            
            if (!tokenRecord) {
                throw createErrorResponse('Invalid or expired reset token', 400);
            }
            
            // Verify user still exists
            const user = await this.userRepository.findById(decoded.userId);
            if (!user) {
                throw createErrorResponse('User not found', 404);
            }
            
            return createSuccessResponse({
                message: 'Valid reset token',
                userId: decoded.userId,
                userEmail: user.email
            });
        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                throw createErrorResponse('Reset token has expired', 400);
            } else if (jwtError.name === 'JsonWebTokenError') {
                throw createErrorResponse('Invalid reset token', 400);
            }
            throw createErrorResponse('Error validating reset token', 500, jwtError.message);
        }
    }
    
    async resetPassword(token, newPassword) {
        try {
            if (!token || !newPassword) {
                throw createErrorResponse('Token and new password are required', 400);
            }
            
            if (newPassword.length < 6) {
                throw createErrorResponse('Password must be at least 6 characters long', 400);
            }
            
            // Validate token first
            const validation = await this.validateResetToken(token);
            const userId = validation.data.userId;
            
            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            
            // Update user password
            await this.userRepository.update(userId, { password: hashedPassword });
            
            // Remove used token from storage
            await this.removeResetToken(token);
            
            console.log('✅ Password reset successfully for user:', userId);
            
            return createSuccessResponse({
                message: 'Password reset successfully'
            });
        } catch (error) {
            if (error.statusCode) throw error;
            throw createErrorResponse('Error resetting password', 500, error.message);
        }
    }
    
    async changePassword(userId, currentPassword, newPassword) {
        try {
            if (!currentPassword || !newPassword) {
                throw createErrorResponse('Current password and new password are required', 400);
            }
            
            if (newPassword.length < 6) {
                throw createErrorResponse('New password must be at least 6 characters long', 400);
            }
            
            const user = await this.userRepository.findById(userId);
            if (!user) {
                throw createErrorResponse('User not found', 404);
            }
            
            // Verify current password
            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isCurrentPasswordValid) {
                throw createErrorResponse('Current password is incorrect', 400);
            }
            
            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            
            // Update user password
            await this.userRepository.update(userId, { password: hashedPassword });
            
            console.log('✅ Password changed successfully for user:', userId);
            
            return createSuccessResponse({
                message: 'Password changed successfully'
            });
        } catch (error) {
            if (error.statusCode) throw error;
            throw createErrorResponse('Error changing password', 500, error.message);
        }
    }
    
    // Private helper methods
    async loadResetTokens() {
        try {
            const data = await fs.readFile(dataFilePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                return [];
            }
            throw error;
        }
    }
    
    async removeResetToken(token) {
        try {
            const resetData = await this.loadResetTokens();
            const filteredData = resetData.filter(record => record.token !== token);
            
            await fs.writeFile(dataFilePath, JSON.stringify(filteredData, null, 2));
        } catch (error) {
            console.error('Error removing reset token:', error);
        }
    }
    
    async cleanExpiredTokens() {
        try {
            const resetData = await this.loadResetTokens();
            const now = new Date();
            
            const validTokens = resetData.filter(record => {
                try {
                    jwt.verify(record.token, process.env.JWT_SECRET);
                    return true;
                } catch (error) {
                    return false;
                }
            });
            
            if (validTokens.length !== resetData.length) {
                await fs.writeFile(dataFilePath, JSON.stringify(validTokens, null, 2));
                console.log(`🧹 Cleaned ${resetData.length - validTokens.length} expired reset tokens`);
            }
        } catch (error) {
            console.error('Error cleaning expired tokens:', error);
        }
    }
}
