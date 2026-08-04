const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
{
    name:{
        type:String,
        required: [true, 'Please add a name']
    },

    email:{
        type:String,
        required: [true, 'Please add an email'],
        unique:true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },

    password:{
        type:String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false
    },

    role:{
        type:String,
        enum:["student","alumni","admin"],
        default:"student"
    },
    bio: { type: String, default: "" },
    branch: { type: String, default: "" },
    year: { type: String, default: "" },
    skills: { type: [String], default: [] },
    profileImage: { type: String, default: "" },
    profileImagePublicId: { type: String, default: "" },
    resume: { type: String, default: "" },
    resumePublicId: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    github: { type: String, default: "" },
    portfolio: { type: String, default: "" },
    company: { type: String, default: "" },
    designation: { type: String, default: "" },
    experience: { type: Number, default: 0 },
    mentorshipDomains: { type: [String], default: [] },
    isAvailable: { type: Boolean, default: true },
    availabilityStatus: { type: String, enum: ["Available", "Busy", "On Leave"], default: "Available" },
    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    completedMentorships: { type: Number, default: 0 },
    recommendationPercentage: { type: Number, default: 0 },
    accountStatus: { type: String, enum: ["Active", "Suspended"], default: "Active" },
    alumniApprovalStatus: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date }
},
{
    timestamps:true
}
);

// Indexes for Alumni Discovery optimization
userSchema.index({ role: 1 });
userSchema.index({ company: 1 });
userSchema.index({ mentorshipDomains: 1 });
userSchema.index({ skills: 1 });
userSchema.index({ isAvailable: 1 });

// Encrypt password using bcrypt
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User",userSchema);