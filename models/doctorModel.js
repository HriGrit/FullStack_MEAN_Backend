import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    deptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      index: true
    },
    specialization: {
      type: String,
      maxlength: 100
    },
    availability: {
      type: String,
      maxlength: 100
    }
  },
  { timestamps: true }
);



export const DoctorModel = mongoose.model('Doctor', doctorSchema);

