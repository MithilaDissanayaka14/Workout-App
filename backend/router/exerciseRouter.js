import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import Exercise from '../model/Exercise.js';

const router = express.Router();

// Get all exercises (Admin created + User created)
router.get('/', protect, async (req, res) => {
    try {
        const exercises = await Exercise.find({
            $or: [
                { createdBy: 'admin' },
                { createdBy: req.user }
            ]
        }).lean();

        // Map over exercises to add helper boolean flags for the frontend
        const mappedExercises = exercises.map(ex => ({
            ...ex,
            isFavorited: ex.favoritedBy ? ex.favoritedBy.includes(req.user) : false,
            isOwner: ex.createdBy === req.user
        }));

        res.json(mappedExercises);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create an exercise
router.post('/', protect, async (req, res) => {
    const { name, category, difficulty, description, image } = req.body;

    if (!name || !category || !difficulty || !description || !image) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }

    try {
        const exercise = new Exercise({
            name,
            category,
            difficulty,
            description,
            image,
            createdBy: req.isAdmin ? 'admin' : req.user // Assign to 'admin' if user is admin, else logged-in user
        });

        const createdExercise = await exercise.save();
        res.status(201).json({
            ...createdExercise.toObject(),
            isFavorited: false,
            isOwner: true
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update a custom exercise
router.put('/:id', protect, async (req, res) => {
    const { name, category, difficulty, description, image } = req.body;

    try {
        const exercise = await Exercise.findById(req.params.id);

        if (!exercise) {
            return res.status(404).json({ message: 'Exercise not found' });
        }

        // Make sure user owns the exercise, OR user is an admin
        if (exercise.createdBy !== req.user && !req.isAdmin) {
            return res.status(403).json({ message: 'Not authorized to update this exercise' });
        }

        exercise.name = name || exercise.name;
        exercise.category = category || exercise.category;
        exercise.difficulty = difficulty || exercise.difficulty;
        exercise.description = description || exercise.description;
        exercise.image = image || exercise.image;

        const updatedExercise = await exercise.save();
        res.json({
            ...updatedExercise.toObject(),
            isFavorited: updatedExercise.favoritedBy ? updatedExercise.favoritedBy.includes(req.user) : false,
            isOwner: true
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete a custom exercise
router.delete('/:id', protect, async (req, res) => {
    try {
        const exercise = await Exercise.findById(req.params.id);

        if (!exercise) {
            return res.status(404).json({ message: 'Exercise not found' });
        }

        // Make sure user owns the exercise, OR user is an admin
        if (exercise.createdBy !== req.user && !req.isAdmin) {
            return res.status(403).json({ message: 'Not authorized to delete this exercise' });
        }

        await Exercise.findByIdAndDelete(req.params.id);
        res.json({ message: 'Exercise removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Toggle Favorite
router.post('/:id/favorite', protect, async (req, res) => {
    try {
        const exercise = await Exercise.findById(req.params.id);

        if (!exercise) {
            return res.status(404).json({ message: 'Exercise not found' });
        }

        // Initialize favoritedBy array if it doesn't exist
        if (!exercise.favoritedBy) {
            exercise.favoritedBy = [];
        }

        const isFavorited = exercise.favoritedBy.includes(req.user);

        if (isFavorited) {
            // Remove from favorites
            exercise.favoritedBy = exercise.favoritedBy.filter(id => id !== req.user);
        } else {
            // Add to favorites
            exercise.favoritedBy.push(req.user);
        }

        await exercise.save();
        
        res.json({ message: isFavorited ? 'Removed from favorites' : 'Added to favorites', isFavorited: !isFavorited });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Seed default exercises (Temporary endpoint)
router.post('/seed', async (req, res) => {
    try {
        const defaultExercises = [
            {
                name: 'Push Up',
                category: 'Chest',
                difficulty: 'Beginner',
                description: '1. Start in a plank position with hands slightly wider than shoulders.\n2. Keep your body in a straight line from head to heels.\n3. Lower your body until your chest nearly touches the floor.\n4. Push back up to the starting position.',
                image: 'https://images.pexels.com/photos/1767812/pexels-photo-1767812.jpeg?auto=compress&cs=tinysrgb&w=800'
            },
            {
                name: 'Pull Up',
                category: 'Back',
                difficulty: 'Advanced',
                description: '1. Grab the pull-up bar with an overhand grip slightly wider than shoulder-width.\n2. Hang freely with your arms fully extended.\n3. Pull yourself up until your chin clears the bar.\n4. Lower yourself slowly back to the starting position.',
                image: 'https://images.pexels.com/photos/1731140/pexels-photo-1731140.jpeg?auto=compress&cs=tinysrgb&w=800'
            },
            {
                name: 'Squat',
                category: 'Legs',
                difficulty: 'Beginner',
                description: '1. Stand with your feet shoulder-width apart.\n2. Lower your hips down and back as if sitting in a chair.\n3. Keep your chest up and your back straight.\n4. Push through your heels to return to the starting position.',
                image: 'https://images.pexels.com/photos/4164840/pexels-photo-4164840.jpeg?auto=compress&cs=tinysrgb&w=800'
            },
            {
                name: 'Deadlift',
                category: 'Back',
                difficulty: 'Intermediate',
                description: '1. Stand with your mid-foot under the barbell.\n2. Bend over and grab the bar with a shoulder-width grip.\n3. Bend your knees until your shins touch the bar.\n4. Lift your chest up and straighten your lower back.\n5. Stand up with the weight.',
                image: 'https://images.pexels.com/photos/4162489/pexels-photo-4162489.jpeg?auto=compress&cs=tinysrgb&w=800'
            },
            {
                name: 'Bench Press',
                category: 'Chest',
                difficulty: 'Intermediate',
                description: '1. Lie on a flat bench with your eyes under the bar.\n2. Grab the bar with a medium grip-width.\n3. Unrack the bar by straightening your arms.\n4. Lower the bar to your mid-chest.\n5. Press the bar back up until your arms are straight.',
                image: 'https://images.pexels.com/photos/3837765/pexels-photo-3837765.jpeg?auto=compress&cs=tinysrgb&w=800'
            },
            {
                name: 'Overhead Press',
                category: 'Shoulders',
                difficulty: 'Intermediate',
                description: '1. Stand with the barbell on your front shoulders.\n2. Press the bar over your head until your arms are fully locked.\n3. Shrug your shoulders at the top.\n4. Lower the bar back to your front shoulders.',
                image: 'https://images.pexels.com/photos/3289711/pexels-photo-3289711.jpeg?auto=compress&cs=tinysrgb&w=800'
            },
            {
                name: 'Barbell Row',
                category: 'Back',
                difficulty: 'Intermediate',
                description: '1. Stand with your mid-foot under the bar.\n2. Bend over and grab the bar with a medium grip.\n3. Keep your back straight and parallel to the floor.\n4. Pull the bar to your lower chest.\n5. Lower the bar back to the floor.',
                image: 'https://images.pexels.com/photos/1431282/pexels-photo-1431282.jpeg?auto=compress&cs=tinysrgb&w=800'
            },
            {
                name: 'Lunge',
                category: 'Legs',
                difficulty: 'Beginner',
                description: '1. Stand up straight with your feet shoulder-width apart.\n2. Step forward with one leg and lower your hips.\n3. Both knees should be bent at a 90-degree angle.\n4. Keep your front knee directly above your ankle.\n5. Push off your front foot to return to the start.',
                image: 'https://images.pexels.com/photos/3757954/pexels-photo-3757954.jpeg?auto=compress&cs=tinysrgb&w=800'
            },
            {
                name: 'Bicep Curl',
                category: 'Arms',
                difficulty: 'Beginner',
                description: '1. Stand holding a dumbbell in each hand with your arms hanging by your sides.\n2. Ensure your elbows are close to your torso.\n3. Curl the weights up while contracting your biceps.\n4. Slowly lower the weights back to the starting position.',
                image: 'https://images.pexels.com/photos/3837743/pexels-photo-3837743.jpeg?auto=compress&cs=tinysrgb&w=800'
            },
            {
                name: 'Tricep Extension',
                category: 'Arms',
                difficulty: 'Beginner',
                description: '1. Stand or sit holding a dumbbell with both hands.\n2. Lift the dumbbell overhead with your arms fully extended.\n3. Lower the weight behind your head by bending your elbows.\n4. Extend your arms back to the starting position.',
                image: 'https://images.pexels.com/photos/1552249/pexels-photo-1552249.jpeg?auto=compress&cs=tinysrgb&w=800'
            },
            {
                name: 'Leg Press',
                category: 'Legs',
                difficulty: 'Intermediate',
                description: '1. Sit on the leg press machine and place your feet on the platform.\n2. Unlatch the safety mechanisms and push the platform all the way up.\n3. Lower the platform slowly until your knees are at a 90-degree angle.\n4. Push the platform back to the starting position.',
                image: 'https://images.pexels.com/photos/3837775/pexels-photo-3837775.jpeg?auto=compress&cs=tinysrgb&w=800'
            },
            {
                name: 'Calf Raise',
                category: 'Legs',
                difficulty: 'Beginner',
                description: '1. Stand on the edge of a step or platform with the balls of your feet.\n2. Let your heels drop down as far as possible.\n3. Push through the balls of your feet to raise your heels as high as possible.\n4. Slowly lower your heels back down.',
                image: 'https://images.pexels.com/photos/136405/pexels-photo-136405.jpeg?auto=compress&cs=tinysrgb&w=800'
            },
            {
                name: 'Lat Pulldown',
                category: 'Back',
                difficulty: 'Beginner',
                description: '1. Sit at a lat pulldown station and grab the bar with a wide grip.\n2. Keep your chest up and your back straight.\n3. Pull the bar down to your upper chest, squeezing your shoulder blades together.\n4. Slowly release the bar back to the starting position.',
                image: 'https://images.pexels.com/photos/4148937/pexels-photo-4148937.jpeg?auto=compress&cs=tinysrgb&w=800'
            },
            {
                name: 'Plank',
                category: 'Core',
                difficulty: 'Beginner',
                description: '1. Start in a push-up position, but rest on your forearms instead of your hands.\n2. Keep your body in a straight line from head to heels.\n3. Engage your core and hold the position for as long as possible.',
                image: 'https://images.pexels.com/photos/3775161/pexels-photo-3775161.jpeg?auto=compress&cs=tinysrgb&w=800'
            },
            {
                name: 'Crunch',
                category: 'Core',
                difficulty: 'Beginner',
                description: '1. Lie on your back with your knees bent and feet flat on the floor.\n2. Place your hands lightly behind your head.\n3. Contract your abs and lift your upper body off the floor.\n4. Lower your upper body back down slowly.',
                image: 'https://images.pexels.com/photos/3775163/pexels-photo-3775163.jpeg?auto=compress&cs=tinysrgb&w=800'
            },
            {
                name: 'Russian Twist',
                category: 'Core',
                difficulty: 'Intermediate',
                description: '1. Sit on the floor with your knees bent and feet slightly off the floor.\n2. Lean back slightly to engage your core.\n3. Clasp your hands together and twist your torso to the right.\n4. Twist back to the center and then to the left.',
                image: 'https://images.pexels.com/photos/4164848/pexels-photo-4164848.jpeg?auto=compress&cs=tinysrgb&w=800'
            },
            {
                name: 'Dips',
                category: 'Chest',
                difficulty: 'Intermediate',
                description: '1. Grab the parallel bars and jump up to starting position.\n2. Lower your body by bending your arms while leaning forward.\n3. Dip down until your shoulders are below your elbows.\n4. Lift your body back up to the starting position by straightening your arms.',
                image: 'https://images.pexels.com/photos/2204196/pexels-photo-2204196.jpeg?auto=compress&cs=tinysrgb&w=800'
            },
            {
                name: 'Leg Curl',
                category: 'Legs',
                difficulty: 'Beginner',
                description: '1. Lie face down on the leg curl machine.\n2. Hook your ankles under the padded lever.\n3. Curl your legs up as far as possible.\n4. Slowly lower your legs back to the starting position.',
                image: 'https://images.pexels.com/photos/4162483/pexels-photo-4162483.jpeg?auto=compress&cs=tinysrgb&w=800'
            },
            {
                name: 'Leg Extension',
                category: 'Legs',
                difficulty: 'Beginner',
                description: '1. Sit on the leg extension machine with your back straight.\n2. Hook your feet under the padded lever.\n3. Extend your legs fully.\n4. Slowly lower the weight back to the starting position.',
                image: 'https://images.pexels.com/photos/3837775/pexels-photo-3837775.jpeg?auto=compress&cs=tinysrgb&w=800'
            },
            {
                name: 'Chest Fly',
                category: 'Chest',
                difficulty: 'Intermediate',
                description: '1. Lie flat on a bench holding two dumbbells above your chest.\n2. Keep a slight bend in your elbows.\n3. Lower the dumbbells out to your sides until you feel a stretch in your chest.\n4. Bring the dumbbells back up to the starting position.',
                image: 'https://images.pexels.com/photos/4162446/pexels-photo-4162446.jpeg?auto=compress&cs=tinysrgb&w=800'
            }
        ];

        // Ensure we only insert if the database doesn't already have default exercises
        const count = await Exercise.countDocuments({ createdBy: 'admin' });
        if (count === 0) {
            await Exercise.insertMany(defaultExercises);
            res.json({ message: 'Exercises seeded successfully' });
        } else {
            res.json({ message: 'Exercises already exist' });
        }

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
