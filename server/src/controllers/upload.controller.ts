import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { BadRequestError } from '../utils/appError';

import fs from 'fs';

// Configure Multer storage
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Store in 'uploads' folder dynamically linked to root
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate secure filename: timestamp + random bytes + extension
        const uniqueSuffix = crypto.randomBytes(8).toString('hex');
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${Date.now()}-${uniqueSuffix}${ext}`);
    },
});

// Configure Multer rules (5MB limit, images only)
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) => {
        // Check file mime type manually
        if (file.mimetype.startsWith('image/') && (
            file.mimetype === 'image/jpeg' ||
            file.mimetype === 'image/png' ||
            file.mimetype === 'image/webp'
        )) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPG, PNG, and WebP are allowed.'));
        }
    },
});

export const uploadImage = (req: Request, res: Response, next: NextFunction): void => {
    // Use multer as a wrapper to catch specifically sized errors
    const singleUpload = upload.single('image');

    singleUpload(req, res, (err: any) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return next(BadRequestError('Max 5MB image allowed.'));
            }
            return next(BadRequestError(err.message));
        } else if (err) {
            return next(BadRequestError(err.message));
        }

        if (!req.file) {
            return next(BadRequestError('No image uploaded'));
        }

        // Construct image URL (assumed statically hosted locally for now)
        const protocol = req.protocol;
        const host = req.get('host');
        const imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

        res.status(200).json({
            success: true,
            data: {
                imageUrl,
            },
        });
    });
};
