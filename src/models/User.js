const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, 'Please add an email'],
            unique: true,
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                'Please add a valid email',
            ],
        },
        username: {
            type: String,
            required: [true, 'Please add a username'],
            unique: true,
            trim: true,
        },
        chat_id: {
            type: String,
            default: null,
        },
        password: {
            type: String,
            required: function() {
                // Password is required if the user doesn't have a google id/isn't logged in via google
                return !this.google_id;
            },
            minlength: 6,
            select: false,
        },
        google_id: {
            type: String,
            default: null,
        },
        profile_pic: {
            type: String,
            default: '',
        },
        full_name: {
            type: String,
            required: [true, 'Please add a full name'],
            trim: true,
        },
        phone_number: {
            type: String,
            required: [true, 'Please add a phone number'],
        },
        role: {
            type: String,
            enum: ['admin', 'root', 'farmer', 'user'],
            default: 'user',
        },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

// Encrypt password using bcrypt before saving if it's modified
userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) {
        next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
