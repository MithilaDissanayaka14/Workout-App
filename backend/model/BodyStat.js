import mongoose from 'mongoose';

const bodyStatSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  entryId: { type: String, index: true },
  date: { type: String, required: true },
  weight: { type: Number, required: true },
  waist: { type: Number },
  mood: { type: String },
  notes: { type: String },
});

const BodyStat = mongoose.model('BodyStat', bodyStatSchema);

export default BodyStat;
