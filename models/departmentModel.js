
import mongoose from 'mongoose';


const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    maxlength: 50
  }
});

export const Department = mongoose.model('Department', departmentSchema);

