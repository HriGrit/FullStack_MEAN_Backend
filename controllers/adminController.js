import mongoose from 'mongoose';
import { Department } from "../models/departmentModel.js"
import { DoctorModel } from "../models/doctorModel.js";
import { User } from "../models/userModel.js";
import { hashPassword,comparePasswords } from "../services/hashServices.js";
// For Department Management


export const adminDashboard=(req,res)=>{
  return res.status(200).json({ success: true, message: 'Welcome to Admin Dashboard' });
}

export const createDepartment = async (req, res) => {
  let { name } = req.body;

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Name is required and must be a string' } });
  }

  name = name.trim().toUpperCase();

  try {
    const existing = await Department.findOne({ name });
    if (existing) {
      return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'Department already exists' } });
    }

    await Department.create({ name });

    return res.status(201).json({ success: true, message: 'Department created successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Something went wrong' } });
  }
};




export const updateDepartment = async (req, res) => {
  const { id } = req.params;
  let { name } = req.body;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_ID', message: 'Invalid department id' } });
  }

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Name is required and must be a string' } });
  }

  name = name.toUpperCase();

  try {
    const existing = await Department.findOne({ name: name.trim() });
    if (existing) {
      return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'Department with this name already exists' } });
    }

    const updated = await Department.findByIdAndUpdate(
      id,
      { name: name.trim() },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Department not found' } });
    }

    return res.status(200).json({ success: true, message: 'Department updated successfully', data: { id: updated._id, name: updated.name } });
  } catch (error) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Something went wrong' } });
  }
};


export const deleteDepartment = async (req, res) => {
  const { id } = req.params;

  try {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_ID', message: 'Invalid department id' } });
    }
    const deleted = await Department.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Department not found' } });
    }

    return res.status(200).json({ success: true, message: 'Department deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Something went wrong' } });
  }
};

//Doctor Operations

export const createDoctor = async (req, res) => {
  const { name, email, password, phone, specialization, deptName, availability } = req.body;

  // Check required fields
  if (!name || !email || !password || !specialization || !deptName) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } });
  }

  try {
    // Convert deptName to uppercase (assuming your DB stores uppercase)
    const deptNameUpper = deptName.trim().toUpperCase();

    // Find department by uppercase name
    const department = await Department.findOne({ name: deptNameUpper });
    if (!department) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Department not found' } });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'Email already exists' } });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create User with role DOCTOR
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role: 'DOCTOR'
    });

    const newDoctor = await DoctorModel.create({
      userId: newUser._id,
      deptId: department._id,
      specialization,
      availability
    });

    return res.status(201).json({
      success: true,
      message: 'Doctor created successfully',
      data: {
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role
        },
        doctor: {
          id: newDoctor._id,
          specialization: newDoctor.specialization,
          availability: newDoctor.availability,
          deptName: department.name
        }
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Something went wrong' } });
  }
};

export const updateDoctor = async (req, res) => {
  const { doctorId } = req.params;
  const { name, email, password, phone, specialization, deptName, availability } = req.body;

  try {
    if (!doctorId || !mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_ID', message: 'Invalid doctor id' } });
    }
    const doctor = await DoctorModel.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Doctor not found' } });
    }

    // Find user linked to doctor
    const user = await User.findById(doctor.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Associated user not found' } });
    }

    // Update department if deptName provided
    let department;
    if (deptName) {
      const deptNameUpper = deptName.trim().toUpperCase();
      department = await Department.findOne({ name: deptNameUpper });
      if (!department) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Department not found' } });
      }
      doctor.deptId = department._id;
    }

    // Update doctor fields
    if (specialization) doctor.specialization = specialization;
    if (availability) doctor.availability = availability;

    // Update user fields
    if (name) user.name = name;
    if (email) {
      // Check if email already exists on another user
      const emailExists = await User.findOne({ email, _id: { $ne: user._id } });
      if (emailExists) {
        return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'Email already in use' } });
      }
      user.email = email;
    }
    if (phone) user.phone = phone;

    if (password) {
      const hashedPassword = await hashPassword(password);
      user.password = hashedPassword;
    }

    await doctor.save();
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Doctor updated successfully',
      data: {
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        doctor: {
          id: doctor._id,
          specialization: doctor.specialization,
          availability: doctor.availability,
          deptName: department ? department.name : undefined
        }
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Something went wrong' } });
  }
};

export const deleteDoctor = async (req, res) => {
  const { doctorId } = req.params;


  try {
    if (!doctorId || !mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_ID', message: 'Invalid doctor id' } });
    }
    const doctor = await DoctorModel.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Doctor not found' } });
    }

    // Delete user associated
    await User.findByIdAndDelete(doctor.userId);

    // Delete doctor profile
    await DoctorModel.findByIdAndDelete(doctorId);

    return res.status(200).json({ success: true, message: 'Doctor and associated user deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Something went wrong' } });
  }
};
