import mongoose from 'mongoose';

const exerciseSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            required: true,
        },
        difficulty: {
            type: String,
            required: true,
            enum: ['Beginner', 'Intermediate', 'Advanced'],
            default: 'Beginner'
        },
        description: {
            type: String,
            required: true,
        },
        image: {
            type: String,
            required: true,
        },
        createdBy: {
            type: String,
            default: 'admin',
        },
        favoritedBy: {
            type: [String],
            default: []
        }
    },
    {
        timestamps: true,
    }
);

const Exercise = mongoose.model('Exercise', exerciseSchema);
export default Exercise;
