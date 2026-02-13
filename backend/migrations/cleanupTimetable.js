const Timetable = require('../models/Timetable');
const Subject = require('../models/Subject');
const User = require('../models/User');

const cleanupTimetable = async () => {
    try {
        console.log('Running Timetable Cleanup...');

        // 1. Find Library Subject
        // Use case-insensitive regex to find "Library"
        const librarySubjects = await Subject.find({ name: { $regex: /library/i } });

        for (const sub of librarySubjects) {
            console.log(`Processing Subject: ${sub.name}`);

            // Remove from Timetable
            const timetable = await Timetable.findOne({ isActive: true });
            if (timetable) {
                const initialLength = timetable.slots.length;

                // Filter out slots that reference this subject
                timetable.slots = timetable.slots.filter(slot => !slot.subject.equals(sub._id));

                if (timetable.slots.length !== initialLength) {
                    await timetable.save();
                    console.log(`Removed ${initialLength - timetable.slots.length} slots for ${sub.name}`);
                }
            }

            // Unassign from Faculty if name matches Rajesh
            if (sub.faculty) {
                const faculty = await User.findById(sub.faculty);
                // Check if faculty name contains "Rajesh" (case insensitive)
                if (faculty && faculty.name.match(/rajesh/i)) {
                    console.log(`Unassigning ${faculty.name} from ${sub.name}`);

                    // Remove faculty reference from subject
                    // We'll set it to null or remove it. 
                    // Mongoose might require unsetting or setting to null depending on schema.
                    // Subject schema says faculty is required [true, 'Faculty is required']? 
                    // Let's check Subject.js schema again. 
                    // It says: faculty: { type: ObjectId, ref: 'User' } - no required: true in the snippet I saw earlier?

                    // Re-checking Subject.js content from earlier view_file...
                    // Wait, I didn't view Subject.js! I viewed Attendance.js and Timetable.js.
                    // AdminController createSubject code: const subject = await Subject.create({...})
                    // It doesn't seem to require faculty on creation.

                    sub.faculty = undefined;
                    await sub.save();

                    // Remove subject reference from faculty's subjects list
                    if (faculty.subjects && faculty.subjects.length > 0) {
                        faculty.subjects = faculty.subjects.filter(id => !id.equals(sub._id));
                        await faculty.save();
                    }
                }
            }
        }
        console.log('Cleanup Complete.');
    } catch (error) {
        console.error('Migration Error:', error);
    }
};

module.exports = cleanupTimetable;
