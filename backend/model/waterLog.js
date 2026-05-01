import mongoose from 'mongoose';

const waterLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: {
        type: Number,
        required: true,
        default: 0
    },
    date: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const WaterLog = mongoose.model('WaterLog', waterLogSchema);

export default WaterLog;
