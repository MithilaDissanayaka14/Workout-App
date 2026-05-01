import WorkoutSchedule from '../model/workoutSchedule.js';

// CREATE: Adds a new workout to the user's private schedule
export const createSchedule = async (req, res) => {
    try {
        const { workoutName, day, time, location, type, userId, duration, intensity, notes } = req.body;
        if (!workoutName || !day || !time || !location || !type) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        const newSchedule = new WorkoutSchedule({
            workoutName, day, time, location, type, userId, duration, intensity, notes
        });
        await newSchedule.save();
        res.status(201).json(newSchedule);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// READ: Fetches only the workouts belonging to the logged-in user
export const getSchedules = async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.status(200).json([]);
        const schedules = await WorkoutSchedule.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json(schedules);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// UPDATE: Modifies an existing workout (Edit/Reschedule)
export const updateSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await WorkoutSchedule.findByIdAndUpdate(id, req.body, { new: true });
        res.status(200).json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// DELETE: Removes a workout entry permanently from MongoDB
export const deleteSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        await WorkoutSchedule.findByIdAndDelete(id);
        res.status(200).json({ message: 'Schedule deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
